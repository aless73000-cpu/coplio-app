import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AgendaClient } from '@/components/syndic/AgendaClient'

export const metadata = { title: 'Agenda' }

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()

  if (!profile?.cabinet_id) redirect('/onboarding')

  const cabinetId = profile.cabinet_id
  const now = new Date().toISOString()
  const in90days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

  const { data: coproprietes } = await supabase
    .from('coproprietes')
    .select('id, nom')
    .eq('cabinet_id', cabinetId)

  const coproprieteIds = (coproprietes ?? []).map((c) => c.id)

  const [ags, echeances, sinistres, gestionnaires, evenements] = await Promise.all([
    supabase
      .from('assemblees_generales')
      .select('id, titre, date_ag, lieu, status, copropriete:coproprietes(nom)')
      .in('copropriete_id', coproprieteIds.length > 0 ? coproprieteIds : ['none'])
      .gte('date_ag', now).lte('date_ag', in90days)
      .neq('status', 'annulee').order('date_ag').limit(20),

    supabase
      .from('appels_charges')
      .select('id, libelle, date_echeance, paye, copropriete:coproprietes(nom)')
      .in('copropriete_id', coproprieteIds.length > 0 ? coproprieteIds : ['none'])
      .eq('paye', false).gte('date_echeance', now).lte('date_echeance', in90days)
      .order('date_echeance').limit(20),

    supabase
      .from('sinistres')
      .select('id, titre, date_sinistre, status, copropriete:coproprietes(nom)')
      .in('copropriete_id', coproprieteIds.length > 0 ? coproprieteIds : ['none'])
      .neq('status', 'cloture').order('date_sinistre', { ascending: false }).limit(10),

    supabase
      .from('profiles')
      .select('id, prenom, nom')
      .eq('cabinet_id', cabinetId)
      .in('role', ['owner', 'manager']),

    supabase
      .from('evenements_cabinet')
      .select('*, assignee:profiles(id, prenom, nom), copropriete:coproprietes(id, nom)')
      .eq('cabinet_id', cabinetId)
      .gte('date_debut', now)
      .order('date_debut').limit(50),
  ])

  const systemEvents = [
    ...(ags.data ?? []).map((a) => ({
      id: a.id, type: 'ag' as const,
      titre: a.titre ?? 'Assemblée générale',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sous_titre: (a.copropriete as any)?.nom,
      date: a.date_ag, lien: `/assemblees/${a.id}`, statut: a.status,
    })),
    ...(echeances.data ?? []).map((e) => ({
      id: e.id, type: 'echeance' as const, titre: e.libelle,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sous_titre: (e.copropriete as any)?.nom,
      date: e.date_echeance, lien: `/appels-charges`, statut: 'À régler',
    })),
    ...(sinistres.data ?? []).map((s) => ({
      id: s.id, type: 'sinistre' as const, titre: s.titre,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sous_titre: (s.copropriete as any)?.nom,
      date: s.date_sinistre, lien: `/sinistres/${s.id}`, statut: s.status,
    })),
  ]

  return (
    <AgendaClient
      systemEvents={systemEvents as Parameters<typeof AgendaClient>[0]['systemEvents']}
      customEvents={(evenements.data ?? []) as unknown as Parameters<typeof AgendaClient>[0]['customEvents']}
      coproprietes={coproprietes ?? []}
      gestionnaires={(gestionnaires.data ?? []).map(g => ({ id: g.id, prenom: g.prenom ?? '', nom: g.nom ?? '' }))}
    />
  )
}
