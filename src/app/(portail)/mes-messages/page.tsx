import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageriePortailWrapper } from '@/components/portail/MessageriePortailWrapper'

export default async function MesMessages() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id, lot:lots(copropriete_id)')
    .eq('id', user.id)
    .single()

  const cabinetId = profile?.cabinet_id ?? null
  const coproprieteId = (profile?.lot as { copropriete_id?: string } | null)?.copropriete_id ?? null

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*, messages(*, expediteur:profiles(prenom, nom, role))')
    .eq('coproprietaire_id', user.id)
    .order('derniere_activite', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-coplio-text">Messagerie</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Échangez avec votre syndic</p>
      </div>
      <MessageriePortailWrapper
        userId={user.id}
        conversations={(conversations ?? []) as Parameters<typeof MessageriePortailWrapper>[0]['conversations']}
        cabinetId={cabinetId}
        coproprieteId={coproprieteId}
      />
    </div>
  )
}
