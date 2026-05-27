import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { withErrorHandler } from '@/lib/api-handler'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export const POST = withErrorHandler(async (
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const limit = await rateLimit(`ia-pv:${user.id}`, { max: 5, windowMs: 60 * 60 * 1000 })
  if (!limit.success) return rateLimitResponse(limit.resetAt)

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id, prenom, nom')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 403 })

  const admin = createAdminClient()

  const { data: ag } = await admin
    .from('assemblees_generales')
    .select(`
      id, titre, type, date_ag, lieu, est_visio, status,
      tantiemes_presents, tantiemes_requis,
      copropriete:coproprietes(nom, adresse, ville, nb_lots, tantiemes_totaux),
      resolutions:ag_resolutions(titre, description, ordre)
    `)
    .eq('id', id)
    .eq('cabinet_id', profile.cabinet_id)
    .single()

  if (!ag) return NextResponse.json({ error: 'AG introuvable' }, { status: 404 })

  const { count: pouvoirsCount } = await admin
    .from('pouvoirs')
    .select('id', { count: 'exact', head: true })
    .eq('ag_id', id)

  const copro = ag.copropriete as {
    nom: string; adresse?: string; ville?: string; nb_lots?: number; tantiemes_totaux?: number
  } | null

  const resolutions = (ag.resolutions as { titre: string; description?: string; ordre: number }[] ?? [])
    .sort((a, b) => a.ordre - b.ordre)

  const dateAg = new Date(ag.date_ag)
  const dateStr = dateAg.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const heureStr = dateAg.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const syndicNom = [profile.prenom, profile.nom].filter(Boolean).join(' ') || 'Le Syndic'

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé IA non configurée' }, { status: 503 })

  const prompt = `Tu es expert en droit de la copropriété française (loi du 10 juillet 1965, décret du 17 mars 1967).
Génère un procès-verbal d'assemblée générale complet, formel et légalement conforme.

DONNÉES DE L'AG :
- Copropriété : ${copro?.nom ?? 'Non renseignée'}
- Adresse : ${[copro?.adresse, copro?.ville].filter(Boolean).join(', ') || 'Non renseignée'}
- Nombre de lots : ${copro?.nb_lots ?? '[À COMPLÉTER]'}
- Tantièmes totaux : ${copro?.tantiemes_totaux ?? '[À COMPLÉTER]'}
- Type : ${ag.type === 'ordinaire' ? 'Assemblée Générale Ordinaire' : 'Assemblée Générale Extraordinaire'}
- Date : ${dateStr} à ${heureStr}
- Lieu : ${ag.est_visio ? 'Visioconférence' : (ag.lieu ?? '[À COMPLÉTER]')}
- Tantièmes présents/représentés : ${ag.tantiemes_presents ?? '[À COMPLÉTER]'} / ${ag.tantiemes_requis ?? copro?.tantiemes_totaux ?? '[À COMPLÉTER]'}
- Nombre de pouvoirs déposés : ${pouvoirsCount ?? 0}
- Syndic : ${syndicNom}

RÉSOLUTIONS À L'ORDRE DU JOUR :
${resolutions.length > 0
    ? resolutions.map((r, i) => `${i + 1}. ${r.titre}${r.description ? `\n   ${r.description}` : ''}`).join('\n')
    : 'Aucune résolution enregistrée — indiquer [ORDRE DU JOUR À COMPLÉTER]'}

INSTRUCTIONS :
- Format : texte pur, aucun markdown, aucune balise
- Structure obligatoire :
  1. En-tête (copropriété, date, heure, lieu)
  2. Bureau de séance (président, secrétaire — mettre [NOM À COMPLÉTER])
  3. Feuille de présence résumée (présents, représentés, pouvoirs)
  4. Vérification du quorum (indiquer si atteint ou non selon les tantièmes)
  5. Pour chaque résolution : intitulé, délibération courte, RÉSULTAT : [X pour / Y contre / Z abstentions] — ADOPTÉ ou REJETÉ
  6. Questions diverses
  7. Clôture de séance
  8. Signatures (syndic + président du conseil syndical si applicable)
- Mettre [À COMPLÉTER] pour toutes les informations manquantes
- Style formel de PV de copropriété, phrases complètes, imparfait de narration`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const content = result.response.text()
    return NextResponse.json({ content })
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la génération IA' }, { status: 502 })
  }
})
