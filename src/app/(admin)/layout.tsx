import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LayoutDashboard, Users, TrendingUp, CreditCard, LogOut, ShieldCheck, MessageSquare, Database } from 'lucide-react'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/revenus', label: 'Revenus & MRR', icon: TrendingUp },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/abonnements', label: 'Abonnements', icon: CreditCard },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/migrations', label: 'Migrations DB', icon: Database },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) {
    redirect('/admin/login')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f4f5f7' }}>
      <aside className="w-60 flex flex-col flex-shrink-0" style={{ background: '#0F2B1F' }}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#374151] rounded-lg flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-base leading-tight">Coplio</p>
              <p className="text-xs text-white/50 leading-tight">Administration</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10">
          <p className="text-xs text-white/40 px-3 mb-2 truncate">{user.email}</p>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
