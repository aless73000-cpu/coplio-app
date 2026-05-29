import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { ParametresClient } from '@/components/syndic/ParametresClient'

export const metadata: Metadata = { title: 'Paramètres' }

export default async function ParamètresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, cabinet:cabinets(*)')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) redirect('/onboarding')

  return <ParametresClient profile={profile as unknown as Parameters<typeof ParametresClient>[0]['profile']} />
}
