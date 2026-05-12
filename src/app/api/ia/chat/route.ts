import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé API IA non configurée' }, { status: 503 })

  const { messages, copropriete_id } = await request.json()
  if (!messages || !Array.isArray(messages)) return NextResponse.json({ error: 'Messages requis' }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 404 })

  const cabinetId = profile.cabinet_id

  const copros = await supabase.from('coproprietes').select('id, nom, nb_lots, statut, ville, montant_impayes').eq('cabinet_id', cabinetId).limit(20)
  const coproprieteIds = (copros.data ?? []).map((c: { id: string }) => c.id)

  const [sinistres, impayes, ags] = await Promise.all([
    supabase.from('sinistres').select('titre, status, copropriete:coproprietes(nom)').eq('cabinet_id', cabinetId).neq('status', 'cloture').limit(10),
    coproprieteIds.length > 0
      ? supabase.from('appels_charges').select('montant, montant_paye, paye, copropriete_id').in('copropriete_id', coproprieteIds).eq('paye', false).limit(30)
      : { data: [] as { montant: number; montant_paye: number; paye: boolean; copropriete_id: string }[] },
    supabase.from('assemblees_generales').select('titre, date_ag, status, copropriete:coproprietes(nom)').eq('cabinet_id', cabinetId).gte('date_ag', new Date().toISOString()).limit(5),
  ])

  const totalImpayes = (impayes.data ?? []).reduce((s, a) => s + (a.montant - a.montant_paye), 0)

  let coproprieteCtx = ''
  if (copropriete_id) {
    const copro = (copros.data ?? []).find(c => c.id === copropriete_id)
    if (copro) coproprieteCtx = `\nCopropriété sélectionnée : ${copro.nom} (${copro.nb_lots} lots, ${copro.ville ?? '—'})`
  }

  const systemPrompt = `Tu es un assistant IA spécialisé dans la gestion de copropriétés pour le cabinet syndic.
Tu as accès aux données réelles du cabinet. Réponds en français, de façon concise et pratique.

DONNÉES DU CABINET :
- Copropriétés gérées (${(copros.data ?? []).length}) : ${(copros.data ?? []).map(c => `${c.nom} (${c.nb_lots} lots, ${c.statut === 'urgent' ? '⚠️ urgent' : c.statut === 'attention' ? '⚡ attention' : '✓ à jour'})`).join(', ')}
- Total impayés : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalImpayes)}
- Sinistres ouverts (${(sinistres.data ?? []).length}) : ${(sinistres.data ?? []).map(s => `${s.titre} (${(s.copropriete as { nom?: string } | null)?.nom ?? '?'}, ${s.status})`).slice(0, 5).join(', ')}
- AG prochaines : ${(ags.data ?? []).map(a => `${a.titre} - ${new Date(a.date_ag).toLocaleDateString('fr-FR')}`).join(', ') || 'Aucune'}
${coproprieteCtx}`

  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ message: text })
}
