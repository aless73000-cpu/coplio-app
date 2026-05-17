import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, ChevronLeft, ChevronRight } from 'lucide-react'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
const PAGE_SIZE = 25

const PLAN_LABELS: Record<string, string> = {
  trial: 'Essai', starter: 'Starter', pro: 'Pro', expert: 'Expert',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Actif', color: 'bg-green-100 text-green-700' },
  trialing: { label: 'Essai', color: 'bg-blue-100 text-blue-700' },
  past_due: { label: 'En retard', color: 'bg-orange-100 text-orange-700' },
  canceled: { label: 'Annulé', color: 'bg-red-100 text-red-700' },
  incomplete: { label: 'Incomplet', color: 'bg-gray-100 text-gray-600' },
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) redirect('/login')

  const page = Math.max(0, parseInt(searchParams.page ?? '0', 10) || 0)
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const admin = createAdminClient()
  const { data: cabinets, count } = await admin
    .from('cabinets')
    .select('id, nom, email_contact, plan, subscription_status, created_at, max_lots', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  const all = cabinets ?? []
  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Clients</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {total} cabinet{total > 1 ? 's' : ''} · page {page + 1}/{Math.max(1, totalPages)}
          </p>
        </div>
      </div>

      <div className="coplio-card p-0 overflow-hidden">
        {all.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Aucun client</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Cabinet</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Plan</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Statut</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Inscription</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {all.map(c => {
                const status = STATUS_LABELS[c.subscription_status ?? 'incomplete'] ?? STATUS_LABELS.incomplete
                return (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-coplio-bg transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-coplio-text">{c.nom}</p>
                      <p className="text-xs text-muted-foreground">{c.email_contact}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-coplio-text">{PLAN_LABELS[c.plan ?? 'trial'] ?? c.plan}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/clients/${c.id}`} className="text-coplio-green hover:underline text-xs font-medium">
                        Gérer →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            {from + 1}–{Math.min(from + PAGE_SIZE, total)} sur {total}
          </p>
          <div className="flex items-center gap-2">
            {page > 0 ? (
              <Link
                href={`/admin/clients?page=${page - 1}`}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-coplio-bg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />Précédent
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border opacity-40 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />Précédent
              </span>
            )}
            {page < totalPages - 1 ? (
              <Link
                href={`/admin/clients?page=${page + 1}`}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-coplio-bg transition-colors"
              >
                Suivant<ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border opacity-40 cursor-not-allowed">
                Suivant<ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
