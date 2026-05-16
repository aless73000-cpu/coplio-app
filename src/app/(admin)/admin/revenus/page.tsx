import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatEuro } from '@/lib/utils'
import { MRRChart } from './MRRChart'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
const PLAN_PRICES: Record<string, number> = { trial: 0, starter: 79, pro: 149, expert: 299 }
const PLAN_LABELS: Record<string, string> = { trial: 'Essai', starter: 'Starter', pro: 'Pro', expert: 'Expert' }
const PLAN_COLORS: Record<string, string> = { trial: '#94a3b8', starter: '#60a5fa', pro: '#0F6E56', expert: '#f59e0b' }

export default async function AdminRevenusPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) redirect('/login')

  const admin = createAdminClient()
  const { data: cabinets } = await admin
    .from('cabinets')
    .select('id, nom, plan, subscription_status, created_at')
    .order('created_at', { ascending: true })

  const all = cabinets ?? []

  // MRR actuel
  const mrr = all
    .filter(c => c.subscription_status === 'active')
    .reduce((sum, c) => sum + (PLAN_PRICES[c.plan ?? 'trial'] ?? 0), 0)

  const arr = mrr * 12

  // Revenus par plan (actifs seulement)
  const byPlan = ['starter', 'pro', 'expert'].map(plan => {
    const clients = all.filter(c => c.plan === plan && c.subscription_status === 'active')
    return { plan, count: clients.length, revenue: clients.length * PLAN_PRICES[plan] }
  })

  // Construction du graphique MRR cumulatif par mois
  const mrrByMonth: Record<string, number> = {}
  all.forEach(c => {
    if (c.subscription_status !== 'active') return
    const month = (c.created_at ?? '').slice(0, 7) // YYYY-MM
    mrrByMonth[month] = (mrrByMonth[month] ?? 0) + (PLAN_PRICES[c.plan ?? 'trial'] ?? 0)
  })

  // Convertir en série cumulée
  const sortedMonths = Object.keys(mrrByMonth).sort()
  let cumul = 0
  const chartData = sortedMonths.map(month => {
    cumul += mrrByMonth[month]
    return {
      month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      mrr: cumul,
    }
  })

  // Si pas de données, on met un point à 0
  if (chartData.length === 0) {
    const now = new Date().toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    chartData.push({ month: now, mrr: 0 })
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-coplio-text">Revenus & MRR</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Suivi des revenus récurrents</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        <div className="coplio-card">
          <p className="text-sm text-muted-foreground mb-1">MRR actuel</p>
          <p className="text-3xl font-bold text-coplio-text">{formatEuro(mrr)}</p>
          <p className="text-xs text-muted-foreground mt-1">Revenu mensuel récurrent</p>
        </div>
        <div className="coplio-card">
          <p className="text-sm text-muted-foreground mb-1">ARR</p>
          <p className="text-3xl font-bold text-coplio-text">{formatEuro(arr)}</p>
          <p className="text-xs text-muted-foreground mt-1">Revenu annuel projeté</p>
        </div>
        <div className="coplio-card">
          <p className="text-sm text-muted-foreground mb-1">Revenu moyen / client</p>
          <p className="text-3xl font-bold text-coplio-text">
            {formatEuro(all.filter(c => c.subscription_status === 'active').length > 0
              ? mrr / all.filter(c => c.subscription_status === 'active').length
              : 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">ARPU mensuel</p>
        </div>
      </div>

      {/* Graphique MRR */}
      <div className="coplio-card mb-6">
        <h2 className="font-semibold text-coplio-text mb-5">Évolution du MRR</h2>
        <MRRChart data={chartData} />
      </div>

      {/* Revenus par plan */}
      <div className="coplio-card">
        <h2 className="font-semibold text-coplio-text mb-4">Revenus par plan</h2>
        <div className="grid grid-cols-3 gap-4">
          {byPlan.map(({ plan, count, revenue }) => (
            <div key={plan} className="p-4 rounded-xl" style={{ background: PLAN_COLORS[plan] + '15' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: PLAN_COLORS[plan] }}>{PLAN_LABELS[plan]}</span>
                <span className="text-xs text-muted-foreground">{count} client{count > 1 ? 's' : ''}</span>
              </div>
              <p className="text-2xl font-bold text-coplio-text">{formatEuro(revenue)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">/ mois</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
