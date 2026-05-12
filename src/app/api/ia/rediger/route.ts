import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const schema = z.object({
  template: z.enum(['convocation_ag', 'pv_ag', 'mise_en_demeure', 'courrier_travaux', 'relance_impaye']),
  copropriete_id: z.string().uuid(),
  donnees: z.record(z.string()).optional(),
})

const TEMPLATES: Record<string, (data: Record<string, string>) => string> = {
  convocation_ag: (d) => `Rédige une convocation d'Assemblée Générale pour la copropriété "${d.nom_copropriete}" située au ${d.adresse ?? 'adresse non renseignée'}, comprenant ${d.nb_lots ?? 'X'} lots. La date de l'AG est le ${d.date_ag ?? 'à définir'} à ${d.heure ?? '18h00'}${d.lieu ? ` en ${d.lieu}` : ''}. Le cabinet syndic est "${d.cabinet_nom ?? 'Votre syndic'}". L'ordre du jour comprend : approbation des comptes, budget prévisionnel, questions diverses. Format professionnel avec en-tête, corps et formule de politesse. En français.`,

  pv_ag: (d) => `Rédige un procès-verbal d'Assemblée Générale pour la copropriété "${d.nom_copropriete}" du ${d.date_ag ?? 'date'}. Présidents de séance, émargement, résolutions votées (approbation des comptes, budget), questions diverses. Format légal PV d'AG en copropriété. En français.`,

  mise_en_demeure: (d) => `Rédige une lettre de mise en demeure pour impayé de charges de copropriété. Copropriétaire : ${d.prenom ?? ''} ${d.nom ?? ''}. Lot n°${d.numero_lot ?? 'X'}. Copropriété : "${d.nom_copropriete}". Montant dû : ${d.montant ?? 'X'} €. Échéance dépassée de ${d.jours_retard ?? 'X'} jours. Syndic : "${d.cabinet_nom ?? 'Votre syndic'}". Ton ferme mais professionnel. Mention des voies de recours. En français.`,

  courrier_travaux: (d) => `Rédige une lettre d'information aux copropriétaires pour des travaux dans la copropriété "${d.nom_copropriete}". Nature des travaux : ${d.nature_travaux ?? 'travaux de maintenance'}. Prestataire : ${d.prestataire ?? 'prestataire désigné'}. Dates : du ${d.date_debut ?? 'X'} au ${d.date_fin ?? 'X'}. Éventuelles gênes et mesures prises. Syndic : "${d.cabinet_nom ?? 'Votre syndic'}". En français.`,

  relance_impaye: (d) => `Rédige une lettre de relance courtoise pour impayé de charges. Copropriétaire : ${d.prenom ?? ''} ${d.nom ?? ''}. Lot n°${d.numero_lot ?? 'X'}. Montant : ${d.montant ?? 'X'} €. Copropriété "${d.nom_copropriete}". Syndic : "${d.cabinet_nom ?? 'Votre syndic'}". Ton amical mais clair. En français.`,
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { template, copropriete_id, donnees = {} } = parsed.data

  // Enrichir avec les données Supabase
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

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé API IA non configurée' }, { status: 503 })

  const client = new Anthropic({ apiKey })
  const prompt = TEMPLATES[template](enriched)

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ texte: text })
}
