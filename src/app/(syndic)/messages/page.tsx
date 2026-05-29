import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SyndicMessages } from '@/components/syndic/SyndicMessages'


export const metadata = { title: 'Messages' }

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) redirect('/onboarding')

  return (
    <div className="flex flex-col h-full">
      <SyndicMessages
        userId={user.id}
        cabinetId={profile.cabinet_id}
        currentEmail={user.email!}
      />
    </div>
  )
}
