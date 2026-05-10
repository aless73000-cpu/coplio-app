import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
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

  const { data: cabinet } = await supabase
    .from('cabinets')
    .select('*')
    .eq('id', profile.cabinet_id)
    .single()

  if (!cabinet) {
    redirect('/onboarding')
  }

  // Notifications non lues
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="flex h-screen bg-coplio-bg overflow-hidden">
      <SessionGuard loginPath="/login" />
      <Sidebar profile={profile as Profile} cabinet={cabinet as Cabinet} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header notifications={notifications ?? []} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
