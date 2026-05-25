import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PortailSidebar } from '@/components/portail/PortailSidebar'
import { PortailBottomNav } from '@/components/portail/PortailBottomNav'
import { NotificationHandler } from '@/components/portail/NotificationHandler'
import { SessionGuard } from '@/components/auth/SessionGuard'

export const metadata: Metadata = {
  title: { default: 'Mon espace — Coplio', template: '%s | Coplio' },
  robots: { index: false, follow: false },
}

export default async function PortailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/portail')

  const [
    { data: profile },
    { count: unreadMessages },
    { count: unreadNotifications },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, lot:lots(numero, copropriete:coproprietes(nom))')
      .eq('id', user.id)
      .single(),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('lu', false)
      .eq('lien', '/mes-messages'),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('lu', false),
  ])

  if (!profile) redirect('/portail')
  if (profile.role !== 'owner_resident') redirect('/dashboard')

  const lot = profile.lot as { numero: string; copropriete: { nom: string } } | null

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f1f5f9' }}>
      <SessionGuard loginPath="/portail" />
      <PortailSidebar
        prenom={profile.prenom}
        nom={profile.nom}
        email={profile.email}
        lotNumero={lot?.numero ?? null}
        coproprieteNom={lot?.copropriete?.nom ?? null}
        unreadMessages={unreadMessages ?? 0}
        unreadNotifications={unreadNotifications ?? 0}
      />
      <NotificationHandler userId={user.id} />
      <main className="flex-1 overflow-y-auto px-4 pt-5 pb-nav md:px-8 md:pt-8 md:pb-8 bg-slate-50">
        {children}
      </main>
      <PortailBottomNav unreadMessages={unreadMessages ?? 0} />
    </div>
  )
}
