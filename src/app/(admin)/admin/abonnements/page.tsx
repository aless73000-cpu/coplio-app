import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatEuro } from '@/lib/utils'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
const PLAN_PRICES: Record<string, number> = { trial: 0, starter: 79, pro: 149, expert: 299 }
const PLAN_LABELS: Record<string, string> = { trial: 'Essai', starter: 'Starter', pro: 'Pro', expert: 'Expert' }
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Actif', color: 'bg-green-100 text-green-700' },
  trialing: { label: 'Essai', color: 'bg-blue-100 text-blue-700' },
  past_due: { label: 'En retard', color: 'bg-orange-100 text-orange-700' },
  canceled: { label: 'Annulé', color: 'bg-red-100 text-red-700' },
  incomplete: { label: 'Incomplet', color: 'bg-gray-100 text-gray-600' },
}

export default async function AdminAbonnementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) redirect('/login')

  const admin = createAdminClient()
  const { data: cabinets } = await admin
    .from('cabinets')
    .select('id, nom, email_contact, plan, subscription_status, current_period_end, trial_ends_at, addon_portail_actif, created_at')
    .order('created_at', { ascending: false })

  const all = cabinets ?? []

  const stats = {
    active: all.filter(c => c.subscription_status === 'active').length,
    trialing: all.filter(c => c.subscription_status === 'trialing').length,
    past_due: all.filter(c => c.subscription_status === 'past_due').length,
    canceled: all.filter(c => c.subscription_status === 'canceled').length,
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-coplio-text">Abonnements</h1>
        <p className="text-muted-foreground text-sm mt-0.5">État de tous les abonnements</p>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {Object.entries(stats).map(([status, count]) => {
          const s = STATUS_LABELS[status]
          return (
            <div key={status} className="coplio-card text-center">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
              <p className="text-3xl font-bold text-coplio-text mt-2">{count}</p>
            </div>
          )
        })}
      </div>

      {/* Tableau */}
      <div className="coplio-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="text-left">
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Cabinet</th>
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Plan</th>
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Statut</th>
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Valeur/mois</th>
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Portail brandé</th>
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Fin période</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {all.map(c => {
              const status = STATUS_LABELS[c.subscription_status ?? 'incomplete'] ?? STATUS_LABELS.incomplete
              const price = PLAN_PRICES[c.plan ?? 'trial'] ?? 0
              const finPeriode = c.current_period_end ?? c.trial_ends_at
              return (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-coplio-bg transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-coplio-text">{c.nom}</p>
                    <p className="text-xs text-muted-foreground">{c.email_contact}</p>
                  </td>
                  <td className="px-5 py-3 text-coplio-text">{PLAN_LABELS[c.plan ?? 'trial'] ?? c.plan}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
                  </td>
                  <td className="px-5 py-3 font-medium text-coplio-text">
                    {price > 0 ? formatEuro(price) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    {c.addon_portail_actif
                      ? <span className="text-xs text-[#374151] font-medium">Actif</span>
                      : <span className="text-xs text-muted-foreground">Non</span>}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {finPeriode ? new Date(finPeriode).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/clients/${c.id}`} className="text-[#374151] hover:underline text-xs font-medium">
                      Gérer →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
