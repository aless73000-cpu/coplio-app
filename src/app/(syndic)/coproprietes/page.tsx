import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  Plus,
  Search,
  Filter,
  MapPin,
  Home,
  AlertTriangle,
  CreditCard,
} from 'lucide-react'
import { formatEuro } from '@/lib/utils'
import type { Copropriete } from '@/types'

export default async function CopropriétésPage({
  searchParams,
}: {
  searchParams: { q?: string; statut?: string }
}) {
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

  if (searchParams.q) {
    query = query.ilike('nom', `%${searchParams.q}%`)
  }

  if (searchParams.statut && searchParams.statut !== 'all') {
    query = query.eq('statut', searchParams.statut)
  }

  const { data: coproprietes } = await query

  const stats = {
    total: coproprietes?.length ?? 0,
    a_jour: coproprietes?.filter((c) => c.statut === 'a_jour').length ?? 0,
    attention: coproprietes?.filter((c) => c.statut === 'attention').length ?? 0,
    urgent: coproprietes?.filter((c) => c.statut === 'urgent').length ?? 0,
  }

  return (
    <div className="space-y-6 animate-fade-in">
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
          className="flex items-center gap-2 bg-coplio-green text-white px-4 py-2.5 rounded-lg
                     text-sm font-medium hover:bg-coplio-green/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </Link>
      </div>

      {/* Filtres rapides */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Toutes', value: 'all', count: stats.total },
          { label: 'À jour', value: 'a_jour', count: stats.a_jour, cls: 'badge-a-jour' },
          { label: 'Attention', value: 'attention', count: stats.attention, cls: 'badge-attention' },
          { label: 'Urgent', value: 'urgent', count: stats.urgent, cls: 'badge-urgent' },
        ].map(({ label, value, count, cls }) => (
          <Link
            key={value}
            href={`/coproprietes?statut=${value}${searchParams.q ? `&q=${searchParams.q}` : ''}`}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              (searchParams.statut ?? 'all') === value
                ? 'bg-coplio-green text-white border-coplio-green'
                : 'bg-white text-coplio-text border-border hover:border-coplio-green/30'
            }`}
          >
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              (searchParams.statut ?? 'all') === value ? 'bg-white/20' : 'bg-coplio-bg'
            }`}>
              {count}
            </span>
          </Link>
        ))}
      </div>

      {/* Liste */}
      {(!coproprietes || coproprietes.length === 0) ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {coproprietes.map((c) => (
            <CoproprieteCard key={c.id} copropriete={c} />
          ))}
        </div>
      )}
    </div>
  )
}

function CoproprieteCard({ copropriete }: { copropriete: Copropriete }) {
  const statusConfig = {
    a_jour: { cls: 'badge-a-jour', label: 'À jour' },
    attention: { cls: 'badge-attention', label: 'Attention' },
    urgent: { cls: 'badge-urgent', label: 'Urgent' },
  }

  const { cls, label } = statusConfig[copropriete.statut] ?? statusConfig.a_jour

  return (
    <Link
      href={`/coproprietes/${copropriete.id}`}
      className="coplio-card hover:shadow-md transition-all hover:-translate-y-0.5 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-coplio-green-light rounded-xl flex items-center justify-center">
          <Building2 className="w-5 h-5 text-coplio-green" />
        </div>
        <span className={cls}>{label}</span>
      </div>

      {/* Nom */}
      <h3 className="font-semibold text-coplio-text group-hover:text-coplio-green transition-colors mb-1">
        {copropriete.nom}
      </h3>

      {/* Adresse */}
      {(copropriete.ville || copropriete.adresse) && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
          <MapPin className="w-3 h-3" />
          {copropriete.ville
            ? `${copropriete.code_postal ? copropriete.code_postal + ' ' : ''}${copropriete.ville}`
            : copropriete.adresse}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
        <Stat icon={Home} label="Lots" value={copropriete.nb_lots} />
        <Stat
          icon={AlertTriangle}
          label="Sinistres"
          value={copropriete.nb_sinistres_ouverts}
          alert={copropriete.nb_sinistres_ouverts > 0}
        />
        <Stat
          icon={CreditCard}
          label="Impayés"
          value={copropriete.montant_impayes > 0 ? formatEuro(copropriete.montant_impayes) : '0'}
          alert={copropriete.montant_impayes > 0}
        />
      </div>
    </Link>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  alert,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  alert?: boolean
}) {
  return (
    <div className="text-center">
      <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${alert ? 'text-coplio-amber' : 'text-muted-foreground'}`} />
      <p className={`text-sm font-bold ${alert ? 'text-coplio-amber' : 'text-coplio-text'}`}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="coplio-card text-center py-16">
      <div className="w-16 h-16 bg-coplio-green-light rounded-full flex items-center justify-center mx-auto mb-4">
        <Building2 className="w-8 h-8 text-coplio-green" />
      </div>
      <h3 className="text-lg font-semibold text-coplio-text mb-2">
        Aucune copropriété
      </h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
        Ajoutez votre première copropriété pour commencer à gérer votre portefeuille.
      </p>
      <Link
        href="/coproprietes/new"
        className="inline-flex items-center gap-2 bg-coplio-green text-white px-6 py-2.5 rounded-lg
                   text-sm font-medium hover:bg-coplio-green/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Ajouter une copropriété
      </Link>
    </div>
  )
}
