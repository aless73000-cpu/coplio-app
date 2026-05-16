import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, TrendingUp, CreditCard, AlertTriangle } from 'lucide-react'
import { formatEuro } from '@/lib/utils'
import Link from 'next/link'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())

const PLAN_PRICES: Record<string, number> = {
  starter: 79,
  pro: 149,
  expert: 299,
  trial: 0,
}

const PLAN_LABELS: Record<string, string> = {
  trial: 'Essai',
  starter: 'Starter',
  pro: 'Pro',
  expert: 'Expert',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Actif', color: 'bg-green-100 text-green-700' },
  trialing: { label: 'Essai', color: 'bg-blue-100 text-blue-700' },
  past_due: { label: 'En retard', color: 'bg-orange-100 text-orange-700' },
  canceled: { label: 'Annulé', color: 'bg-red-100 text-red-700' },
  incomplete: { label: 'Incomplet', color: 'bg-gray-100 text-gray-600' },
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) redirect('/login')

  const admin = createAdminClient()
  const { data: cabinets } = await admin
    .from('cabinets')
    .select('id, nom, email_contact, plan, subscription_status, created_at')
    .order('created_at', { ascending: false })

  const all = cabinets ?? []

  const total = all.length
  const actifs = all.filter(c => c.subscription_status === 'active').length
  const enEssai = all.filter(c => c.subscription_status === 'trialing').length
  const enRetard = all.filter(c => c.subscription_status === 'past_due').length

  const mrr = all
    .filter(c => c.subscription_status === 'active')
    .reduce((sum, c) => sum + (PLAN_PRICES[c.plan ?? 'trial'] ?? 0), 0)

  const byPlan = ['trial', 'starter', 'pro', 'expert'].map(plan => ({
    plan,
    count: all.filter(c => c.plan === plan).length,
  }))

  const recents = all.slice(0, 5)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-coplio-text">Dashboard Admin</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Vue générale de la plateforme</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <div className="coplio-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-coplio-green/10 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-coplio-green" />
            </div>
            <p className="text-sm text-muted-foreground">Clients totaux</p>
          </div>
          <p className="text-3xl font-bold text-coplio-text">{total}</p>
        </div>

        <div className="coplio-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-coplio-green/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-coplio-green" />
            </div>
            <p className="text-sm text-muted-foreground">MRR</p>
          </div>
          <p className="text-3xl font-bold text-coplio-text">{formatEuro(mrr)}</p>
        </div>

        <div className="coplio-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-sm text-muted-foreground">Actifs</p>
          </div>
          <p className="text-3xl font-bold text-coplio-text">{actifs}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{enEssai} en essai</p>
        </div>

        <div className="coplio-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-sm text-muted-foreground">En retard</p>
          </div>
          <p className="text-3xl font-bold text-coplio-text">{enRetard}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par plan */}
        <div className="coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4">Abonnements par plan</h2>
          <div className="space-y-3">
            {byPlan.map(({ plan, count }) => (
              <div key={plan} className="flex items-center justify-between">
                <span className="text-sm text-coplio-text">{PLAN_LABELS[plan]}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-coplio-bg rounded-full h-2">
                    <div
                      className="bg-coplio-green h-2 rounded-full"
                      style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-sm font-medium text-coplio-text w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Derniers inscrits */}
        <div className="coplio-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-coplio-text">Derniers inscrits</h2>
            <Link href="/admin/clients" className="text-xs text-coplio-green hover:underline">Voir tous</Link>
          </div>
          <div className="space-y-3">
            {recents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun client</p>
            )}
            {recents.map(c => {
              const status = STATUS_LABELS[c.subscription_status ?? 'incomplete'] ?? STATUS_LABELS.incomplete
              return (
                <Link key={c.id} href={`/admin/clients/${c.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-coplio-bg transition-colors">
                  <div>
                    <p className="text-sm font-medium text-coplio-text">{c.nom}</p>
                    <p className="text-xs text-muted-foreground">{c.email_contact}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
