import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { withErrorHandler } from '@/lib/api-handler'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export const POST = withErrorHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const limit = await rateLimit(`ia-odj:${user.id}`, { max: 15, windowMs: 60 * 60 * 1000 })
  if (!limit.success) return rateLimitResponse(limit.resetAt)

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 404 })

  const body = await request.json()
  const { copropriete_id, type_ag } = body as { copropriete_id: string; type_ag?: string }

  if (!copropriete_id) return NextResponse.json({ error: 'copropriete_id requis' }, { status: 400 })

  const { data: copropriete } = await supabase
    .from('coproprietes')
    .select('id, nom, nb_lots, cabinet_id')
    .eq('id', copropriete_id)
    .eq('cabinet_id', profile.cabinet_id)
    .single()

  if (!copropriete) return NextResponse.json({ error: 'Copropriété introuvable' }, { status: 404 })

  const [{ data: sinistres }, { data: appels }, { data: contrats }] = await Promise.all([
    supabase.from('sinistres').select('titre, status').eq('copropriete_id', copropriete_id).neq('status', 'cloture').limit(10),
    supabase.from('appels_charges').select('libelle, montant, paye').eq('copropriete_id', copropriete_id).eq('paye', false).limit(5),
    supabase.from('documents').select('nom, categorie').eq('copropriete_id', copropriete_id).eq('categorie', 'contrat').limit(5),
  ])

  const context = {
    copropriete: copropriete.nom,
    nb_lots: copropriete.nb_lots,
    type_ag: type_ag ?? 'ordinaire',
    sinistres_ouverts: (sinistres ?? []).map(s => ({ titre: s.titre, status: s.status })),
    impayes_en_cours: (appels ?? []).length,
    contrats: (contrats ?? []).map(c => c.nom),
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé API IA non configurée' }, { status: 503 })

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `Tu es expert en droit de la copropriété française (loi du 10 juillet 1965, décret du 17 mars 1967, loi ALUR).

Génère un ordre du jour complet et légalement correct pour une assemblée générale ${context.type_ag} de la copropriété "${context.copropriete}" (${context.nb_lots} lots).

Contexte :
- Sinistres ouverts : ${context.sinistres_ouverts.length > 0 ? JSON.stringify(context.sinistres_ouverts) : 'aucun'}
- Impayés en cours : ${context.impayes_en_cours}
- Contrats actifs : ${context.contrats.length > 0 ? context.contrats.join(', ') : 'non renseignés'}

Retourne UNIQUEMENT un JSON valide (sans markdown) avec ce format exact :
{
  "items": [
    { "titre": "...", "type": "obligatoire|vote|information", "article_loi": "art. X" }
  ]
}

Pour une AG ordinaire, inclure obligatoirement :
1. Approbation des comptes de l'exercice écoulé (art. 24)
2. Vote du budget prévisionnel (art. 14-1)
3. Rapport du conseil syndical (si applicable)
4. Questions diverses

Si des sinistres sont ouverts, ajouter les résolutions correspondantes.
Maximum 10 items. Sois précis et actionnable.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ items: [] })

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch {
    // Fallback items si Gemini échoue
    return NextResponse.json({
      items: [
        { titre: 'Approbation des comptes de l\'exercice écoulé', type: 'obligatoire', article_loi: 'art. 24' },
        { titre: 'Vote du budget prévisionnel', type: 'vote', article_loi: 'art. 14-1' },
        { titre: 'Rapport du conseil syndical', type: 'information', article_loi: '' },
        { titre: 'Ratification des dépenses urgentes', type: 'vote', article_loi: 'art. 37' },
        { titre: 'Questions diverses', type: 'information', article_loi: '' },
      ],
    })
  }
})
