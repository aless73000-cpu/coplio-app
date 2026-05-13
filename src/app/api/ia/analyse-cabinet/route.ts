import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé API IA non configurée' }, { status: 503 })

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 404 })

  const cabinetId = profile.cabinet_id

  const { data: copros } = await supabase.from('coproprietes').select('id, nom, nb_lots, statut, montant_impayes').eq('cabinet_id', cabinetId)
  const coproprieteIds = (copros ?? []).map(c => c.id)

  const [appels, sinistres, ags] = await Promise.all([
    coproprieteIds.length > 0
      ? supabase.from('appels_charges').select('copropriete_id, montant, montant_paye, paye, date_echeance, created_at').in('copropriete_id', coproprieteIds).order('date_echeance', { ascending: false }).limit(200)
      : { data: [] },
    supabase.from('sinistres').select('copropriete_id, status, created_at').eq('cabinet_id', cabinetId).limit(50),
    supabase.from('assemblees_generales').select('copropriete_id, date_ag, status').eq('cabinet_id', cabinetId).limit(20),
  ])

  // Calcul des scores de risque par copropriété
  const scores = (copros ?? []).map(c => {
    const cAppels = (appels.data ?? []).filter(a => a.copropriete_id === c.id)
    const cImpayes = cAppels.filter(a => !a.paye)
    const totalDu = cAppels.reduce((s, a) => s + a.montant, 0)
    const totalPaye = cAppels.reduce((s, a) => s + a.montant_paye, 0)
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
      nbAppels: cAppels.length,
    }
  }).sort((a, b) => a.score - b.score)

  // Détection d'anomalies via IA
  const dataResume = JSON.stringify({
    coproprietes: (copros ?? []).map(c => ({ nom: c.nom, nb_lots: c.nb_lots, statut: c.statut, montant_impayes: c.montant_impayes })),
    totalAppels: (appels.data ?? []).length,
    totalImpayes: (appels.data ?? []).filter(a => !a.paye).reduce((s, a) => s + (a.montant - a.montant_paye), 0),
    sinistresParStatut: (sinistres.data ?? []).reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    scores: scores.slice(0, 5),
  })

  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Analyse ces données d'un cabinet de syndic de copropriété et détecte les anomalies et risques.

DONNÉES : ${dataResume}

Retourne une analyse JSON avec exactement ce format :
{
  "anomalies": [
    {"titre": "...", "description": "...", "severite": "haute|moyenne|faible", "copropriete": "nom ou null"}
  ],
  "recommandations": ["...", "...", "..."],
  "points_positifs": ["...", "..."],
  "resume": "résumé court en 1-2 phrases"
}

Maximum 5 anomalies, 3 recommandations, 3 points positifs. Sois précis et actionnable.`,
    }],
  })

  let analyse = { anomalies: [], recommandations: [], points_positifs: [], resume: '' }
  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) analyse = JSON.parse(jsonMatch[0])
  } catch {
    analyse = { anomalies: [], recommandations: [], points_positifs: [], resume: 'Analyse indisponible' }
  }

  return NextResponse.json({ scores, analyse })
}
