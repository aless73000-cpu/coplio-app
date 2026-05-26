import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

const schema = z.object({
  template: z.enum(['convocation_ag', 'pv_ag', 'mise_en_demeure', 'courrier_travaux', 'relance_impaye', 'contrat_prestataire', 'courrier_resiliation', 'notice_annuelle']),
  copropriete_id: z.string().uuid(),
  donnees: z.record(z.string()).optional(),
})

const TEMPLATES: Record<string, (data: Record<string, string>) => string> = {
  convocation_ag: (d) => `Rédige une convocation officielle d'Assemblée Générale de copropriété en Markdown structuré.

Données :
- Copropriété : "${d.nom_copropriete}" — ${d.adresse ?? 'adresse non renseignée'} — ${d.nb_lots ?? 'X'} lots
- Date / heure : ${d.date_ag ?? 'à définir'}${d.lieu ? ` — ${d.lieu}` : ''}
- Cabinet syndic : "${d.cabinet_nom ?? 'Votre syndic'}"

Format Markdown attendu :
- # pour le titre principal du document
- ## pour chaque grande section (Objet, Ordre du jour, Modalités de participation, etc.)
- **gras** pour les informations clés (date, montants, délais légaux)
- Listes à puces (-) pour l'ordre du jour complet
- Structure complète : en-tête administratif, objet, corps légal, ordre du jour détaillé, modalités de vote, formule de politesse et signature
- Ton formel et juridiquement correct. Document prêt à envoyer. Rédigé en français.`,

  pv_ag: (d) => `Rédige un procès-verbal complet d'Assemblée Générale de copropriété en Markdown structuré.

Données :
- Copropriété : "${d.nom_copropriete}"
- Date de l'AG : ${d.date_ag ?? 'date à renseigner'}
- Cabinet syndic : "${d.cabinet_nom ?? 'Votre syndic'}"

Format Markdown attendu :
- # pour le titre "PROCÈS-VERBAL D'ASSEMBLÉE GÉNÉRALE"
- ## pour chaque section (Ouverture de séance, Présences et quorum, Résolutions, Clôture)
- **gras** pour les résultats de votes et les montants votés
- Listes numérotées (1.) pour les résolutions
- Structure complète : en-tête légal, constatation du quorum, résolutions détaillées avec votes (pour/contre/abstention), questions diverses, clôture. Format légal PV d'AG en France. Rédigé en français.`,

  mise_en_demeure: (d) => `Rédige une lettre de mise en demeure pour impayé de charges de copropriété en Markdown structuré.

Données :
- Copropriétaire : ${d.prenom ?? 'Prénom'} ${d.nom ?? 'NOM'}
- Lot n° : ${d.numero_lot ?? 'X'}
- Copropriété : "${d.nom_copropriete}"
- Montant dû : **${d.montant ?? 'X'} €**
- Retard : ${d.jours_retard ?? 'X'} jours
- Cabinet syndic : "${d.cabinet_nom ?? 'Votre syndic'}"

Format Markdown attendu :
- # pour le titre "MISE EN DEMEURE — IMPAYÉ DE CHARGES"
- ## pour chaque section (Objet, Situation actuelle, Mise en demeure, Voies de recours)
- **gras** pour les montants, délais et mentions légales importantes
- Ton ferme, professionnel et juridiquement correct. Mention explicite des voies de recours (procédure amiable, injonction de payer). Rédigé en français.`,

  courrier_travaux: (d) => `Rédige un courrier d'information aux copropriétaires concernant des travaux en Markdown structuré.

Données :
- Copropriété : "${d.nom_copropriete}"
- Nature des travaux : ${d.nature_travaux ?? 'travaux de maintenance'}
- Prestataire : ${d.prestataire ?? 'prestataire désigné'}
- Dates : du ${d.date_debut ?? 'X'} au ${d.date_fin ?? 'X'}
- Cabinet syndic : "${d.cabinet_nom ?? 'Votre syndic'}"

Format Markdown attendu :
- # pour le titre principal
- ## pour chaque section (Objet des travaux, Calendrier, Impacts et précautions, Contact)
- **gras** pour les dates et informations importantes
- Listes à puces pour les impacts pratiques et mesures prises
- Ton informatif et rassurant. Rédigé en français.`,

  relance_impaye: (d) => `Rédige une lettre de relance courtoise pour impayé de charges de copropriété en Markdown structuré.

Données :
- Copropriétaire : ${d.prenom ?? 'Prénom'} ${d.nom ?? 'NOM'}
- Lot n° : ${d.numero_lot ?? 'X'}
- Montant dû : **${d.montant ?? 'X'} €**
- Copropriété : "${d.nom_copropriete}"
- Cabinet syndic : "${d.cabinet_nom ?? 'Votre syndic'}"

Format Markdown attendu :
- # pour le titre "RAPPEL — CHARGES DE COPROPRIÉTÉ"
- ## pour chaque section (Objet, Situation, Modalités de règlement)
- **gras** pour le montant et les informations de paiement
- Ton amical mais clair. Coordonnées de contact en fin de document. Rédigé en français.`,

  contrat_prestataire: (d) => `Rédige un contrat de prestation de services pour une copropriété en Markdown structuré.

Données :
- Copropriété (client) : "${d.nom_copropriete}" — représentée par le cabinet "${d.cabinet_nom ?? 'Votre syndic'}"
- Prestataire : ${d.prestataire ?? 'Nom du prestataire'} — SIRET : ${d.siret ?? 'X'}
- Objet de la prestation : ${d.objet ?? 'prestation à définir'}
- Montant HT : ${d.montant ?? 'X'} €
- Durée / période : ${d.duree ?? 'à définir'}

Format Markdown attendu :
- # pour le titre "CONTRAT DE PRESTATION DE SERVICES"
- ## pour chaque article (Parties, Objet, Durée, Prix et modalités de paiement, Obligations du prestataire, Résiliation, Litiges)
- **gras** pour les montants, dates et obligations clés
- Numéroter les articles (Article 1, Article 2…)
- Espace pour signatures en fin de document
- Ton juridique, conforme au droit français. Rédigé en français.`,

  courrier_resiliation: (d) => `Rédige un courrier de résiliation de contrat prestataire pour une copropriété en Markdown structuré.

Données :
- Copropriété : "${d.nom_copropriete}" — cabinet syndic : "${d.cabinet_nom ?? 'Votre syndic'}"
- Prestataire destinataire : ${d.prestataire ?? 'Nom du prestataire'}
- Motif de résiliation : ${d.motif ?? 'fin de contrat'}
- Préavis : ${d.preavis ?? '3 mois'}
- Date effective souhaitée : ${d.date_resiliation ?? 'à définir'}

Format Markdown attendu :
- # pour le titre "RÉSILIATION DE CONTRAT"
- ## pour chaque section (Objet, Motif, Date d'effet, Restitution, Solde de tout compte)
- **gras** pour les dates et obligations légales
- Ton formel et factuel. Accusé de réception recommandé mentionné. Rédigé en français.`,

  notice_annuelle: (d) => `Rédige une notice d'information annuelle aux copropriétaires en Markdown structuré.

Données :
- Copropriété : "${d.nom_copropriete}" — ${d.adresse ?? 'adresse'}
- Année : ${d.annee ?? new Date().getFullYear()}
- Cabinet syndic : "${d.cabinet_nom ?? 'Votre syndic'}"
- Points clés à mentionner : travaux prévus, budget voté, fonds de travaux, prochain AG

Format Markdown attendu :
- # pour le titre "BILAN ANNUEL ${d.annee ?? new Date().getFullYear()} — ${d.nom_copropriete}"
- ## pour chaque section (Mot du syndic, Bilan financier, Travaux réalisés et prévus, Fonds de travaux ALUR, Prochaine Assemblée Générale, Contact)
- **gras** pour les chiffres, dates importantes
- Listes à puces pour les travaux et points d'action
- Ton informatif et positif. Rédigé en français.`,
}

export const POST = withErrorHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const limit = await rateLimit(`ia-rediger:${user.id}`, { max: 20, windowMs: 60 * 60 * 1000 })
  if (!limit.success) return rateLimitResponse(limit.resetAt)

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { template, copropriete_id, donnees = {} } = parsed.data

  const { data: copropriete } = await supabase
    .from('coproprietes')
    .select('nom, adresse, nb_lots, cabinet:cabinets(nom)')
    .eq('id', copropriete_id)
    .single()

  const enriched: Record<string, string> = {
    nom_copropriete: copropriete?.nom ?? '',
    adresse: copropriete?.adresse ?? '',
    nb_lots: String(copropriete?.nb_lots ?? ''),
    cabinet_nom: (copropriete?.cabinet as { nom?: string } | null)?.nom ?? 'Votre syndic',
    ...donnees,
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé API IA non configurée' }, { status: 503 })

  const prompt = TEMPLATES[template](enriched)

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return NextResponse.json({ texte: text })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur IA inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
})
