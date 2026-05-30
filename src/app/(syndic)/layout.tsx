import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: { default: 'Tableau de bord', template: '%s | Coplio' },
  robots: { index: false, follow: false },
}
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { SyndicBottomNav } from '@/components/layout/SyndicBottomNav'
import { SessionGuard } from '@/components/auth/SessionGuard'
import { ConflictBanner } from '@/components/auth/ConflictBanner'
import type { Profile, Cabinet } from '@/types'

export default async function SyndicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Charger le profil + cabinet
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'owner_resident') {
    redirect('/accueil?conflict=syndic')
  }

  if (!profile.cabinet_id) {
    redirect('/onboarding')
  }

  // Cabinet + notifications : requêtes indépendantes → parallélisées
  const [
    { data: cabinet },
    { data: notifications },
    { count: unreadMessages },
    { count: urgentSinistres },
  ] = await Promise.all([
    supabase
      .from('cabinets')
      .select('*')
      .eq('id', profile.cabinet_id)
      .single(),
    supabase
      .from('notifications')
      .select('id, user_id, type, titre, message, lien, lu, lu_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('lu', false)
      .eq('lien', '/messages'),
    supabase
      .from('sinistres')
      .select('id', { count: 'exact', head: true })
      .eq('cabinet_id', profile.cabinet_id)
      .eq('status', 'urgence'),
  ])

  if (!cabinet) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <SessionGuard loginPath="/login" />
      <ConflictBanner />
      {/* Sidebar desktop — cachée sur mobile */}
      <div className="hidden md:flex">
        <Sidebar profile={profile as Profile} cabinet={cabinet as Cabinet} unreadMessages={unreadMessages ?? 0} urgentSinistres={urgentSinistres ?? 0} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          notifications={(notifications ?? []) as unknown as Parameters<typeof Header>[0]['notifications']}
          userId={user.id}
          mobileSidebar={
            <MobileSidebar
              profile={profile as Profile}
              cabinet={cabinet as Cabinet}
              unreadMessages={unreadMessages ?? 0}
              urgentSinistres={urgentSinistres ?? 0}
            />
          }
        />
        <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 md:px-6 md:py-6 dark:bg-slate-950">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <SyndicBottomNav unreadMessages={unreadMessages ?? 0} />
    </div>
  )
}
