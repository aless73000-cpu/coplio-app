import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: { default: 'Tableau de bord — Coplio', template: '%s | Coplio' },
  robots: { index: false, follow: false },
}
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { SessionGuard } from '@/components/auth/SessionGuard'
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
    redirect('/mes-charges')
  }

  if (!profile.cabinet_id) {
    redirect('/onboarding')
  }

  // Cabinet + notifications + sinistres urgents : requêtes parallélisées
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
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('lu', false)
      .eq('lien', '/messages'),
    supabase
      .from('sinistres')
      .select('*', { count: 'exact', head: true })
      .eq('cabinet_id', profile.cabinet_id!)
      .eq('status', 'urgence'),
  ])

  if (!cabinet) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen bg-coplio-bg overflow-hidden">
      <SessionGuard loginPath="/login" />
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-nav md:pb-6">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
      <MobileBottomNav unreadMessages={unreadMessages ?? 0} />
    </div>
  )
}
