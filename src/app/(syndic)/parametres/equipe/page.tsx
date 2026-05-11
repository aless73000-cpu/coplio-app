import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { EquipeClient } from '@/components/syndic/EquipeClient'
import { checkQuota } from '@/lib/plan-guard'

export const metadata: Metadata = { title: 'Mon équipe' }

export default async function EquipePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, cabinet_id')
    .eq('id', user.id)
    .single()

  if (!profile?.cabinet_id) redirect('/onboarding')

  const quota = await checkQuota(profile.cabinet_id, 'gestionnaires')

  return (
    <EquipeClient
      currentUserId={user.id}
      isOwner={profile.role === 'owner'}
      quota={quota}
    />
  )
}
