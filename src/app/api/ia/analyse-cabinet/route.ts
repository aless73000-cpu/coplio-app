import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { withErrorHandler } from '@/lib/api-handler'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export const GET = withErrorHandler(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 404 })

  const limit = await rateLimit(`ia-analyse:${user.id}`, { max: 10, windowMs: 60 * 60 * 1000 })
  if (!limit.success) return rateLimitResponse(limit.resetAt)

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé API IA non configurée' }, { status: 503 })

  const cabinetId = profile.cabinet_id

  const { data: copros } = await supabase.from('coproprietes').select('id, nom, nb_lots, statut, montant_impayes').eq('cabinet_id', cabinetId)
  const coproprieteIds = (copros ?? []).map(c => c.id)

  const [appels, sinistres] = await Promise.all([
    coproprieteIds.length > 0
      ? supabase.from('appels_charges').select('copropriete_id, montant, montant_paye, paye, date_echeance').in('copropriete_id', coproprieteIds).order('date_echeance', { ascending: false }).limit(200)
      : { data: [] },
    supabase.from('sinistres').select('copropriete_id, status').eq('cabinet_id', cabinetId).limit(50),
  ])

  // Calcul des scores de risque par copropriété
  const scores = (copros ?? []).map(c => {
    const cAppels = (appels.data ?? []).filter(a => a.copropriete_id === c.id)
    const totalDu = cAppels.reduce((s, a) => s + a.montant, 0)
    const totalPaye = cAppels.reduce((s, a) => s + (a.montant_paye ?? 0), 0)
    const tauxImpaye = totalDu > 0 ? ((totalDu - totalPaye) / totalDu) * 100 : 0
    const sinistresOuverts = (sinistres.data ?? []).filter(s => s.copropriete_id === c.id && s.status !== 'cloture').length

    let score = 100
    score -= Math.min(40, tauxImpaye * 0.8)
    score -= sinistresOuverts * 5
    if (c.statut === 'urgent') score -= 20
    if (c.statut === 'attention') score -= 10
    score = Math.max(0, Math.round(score))

    const niveau = score >= 80 ? 'faible' : score >= 60 ? 'moyen' : score >= 40 ? 'élevé' : 'critique'

    return {
      copropriete_id: c.id,
      nom: c.nom,
      score,
      niveau,
      tauxImpaye: Math.round(tauxImpaye),
      montantImpayes: c.montant_impayes ?? 0,
      sinistresOuverts,
    }
  }).sort((a, b) => a.score - b.score)

  const dataResume = JSON.stringify({
    coproprietes: (copros ?? []).map(c => ({ nom: c.nom, nb_lots: c.nb_lots, statut: c.statut, montant_impayes: c.montant_impayes })),
    totalImpayes: (appels.data ?? []).filter(a => !a.paye).reduce((s, a) => s + (a.montant - (a.montant_paye ?? 0)), 0),
    sinistresParStatut: (sinistres.data ?? []).reduce((acc, s) => {
      acc[s.status ?? 'unknown'] = (acc[s.status ?? 'unknown'] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    scores: scores.slice(0, 5),
  })

  let analyse = { anomalies: [] as unknown[], recommandations: [] as string[], points_positifs: [] as string[], resume: '' }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent(`Analyse ces données d'un cabinet de syndic de copropriété et détecte les anomalies et risques.

DONNÉES : ${dataResume}

Retourne une analyse JSON avec exactement ce format (sans markdown, juste le JSON brut) :
{
  "anomalies": [
    {"titre": "...", "description": "...", "severite": "haute|moyenne|faible", "copropriete": "nom ou null"}
  ],
  "recommandations": ["...", "...", "..."],
  "points_positifs": ["...", "..."],
  "resume": "résumé court en 1-2 phrases"
}

Maximum 5 anomalies, 3 recommandations, 3 points positifs. Sois précis et actionnable.`)

    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) analyse = JSON.parse(jsonMatch[0])
  } catch {
    analyse = { anomalies: [], recommandations: [], points_positifs: [], resume: 'Analyse indisponible' }
  }

  return NextResponse.json({ scores, analyse })
})
