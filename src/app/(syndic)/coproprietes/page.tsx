import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Copropriete } from '@/types'
import { CoproprietesClient } from '@/components/syndic/CoproprietesClient'


export const metadata = { title: 'Copropriétés' }

export default async function CopropriétésPage(
  props: {
    searchParams: Promise<{ q?: string; statut?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()

  if (!profile?.cabinet_id) redirect('/onboarding')

  let query = supabase
    .from('coproprietes')
    .select('*')
    .eq('cabinet_id', profile.cabinet_id)
    .order('nom', { ascending: true })

  if (searchParams.q) query = query.ilike('nom', `%${searchParams.q}%`)
  if (searchParams.statut && searchParams.statut !== 'all') query = query.eq('statut', searchParams.statut)

  const { data: coproprietes } = await query

  const stats = {
    total: coproprietes?.length ?? 0,
    a_jour: coproprietes?.filter((c) => c.statut === 'a_jour').length ?? 0,
    attention: coproprietes?.filter((c) => c.statut === 'attention').length ?? 0,
    urgent: coproprietes?.filter((c) => c.statut === 'urgent').length ?? 0,
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Copropriétés</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {stats.total} copropriété{stats.total > 1 ? 's' : ''} dans votre portefeuille
          </p>
        </div>
        <Link
          href="/coproprietes/new"
          className="flex items-center gap-2 bg-[#374151] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#374151]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />Ajouter
        </Link>
      </div>

      {/* Filtres rapides */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Toutes', value: 'all', count: stats.total },
          { label: 'À jour', value: 'a_jour', count: stats.a_jour },
          { label: 'Attention', value: 'attention', count: stats.attention },
          { label: 'Urgent', value: 'urgent', count: stats.urgent },
        ].map(({ label, value, count }) => (
          <Link
            key={value}
            href={`/coproprietes?statut=${value}${searchParams.q ? `&q=${searchParams.q}` : ''}`}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              (searchParams.statut ?? 'all') === value
                ? 'bg-[#374151] text-white border-[#374151]'
                : 'bg-white text-coplio-text border-border hover:border-[#374151]/30'
            }`}
          >
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${(searchParams.statut ?? 'all') === value ? 'bg-white/20' : 'bg-coplio-bg'}`}>
              {count}
            </span>
          </Link>
        ))}
      </div>

      {/* Client component handles list/map/prospects views */}
      <CoproprietesClient coproprietes={(coproprietes ?? []) as Copropriete[]} />
    </div>
  )
}
