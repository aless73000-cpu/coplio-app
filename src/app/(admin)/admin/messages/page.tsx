import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessagesClient } from './MessagesClient'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())

export default async function AdminMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) redirect('/login')

  const admin = createAdminClient()
  const { data: cabinets } = await admin
    .from('cabinets')
    .select('id, nom')
    .order('nom')

  return (
    <MessagesClient
      currentEmail={user.email!}
      cabinets={cabinets ?? []}
    />
  )
}
