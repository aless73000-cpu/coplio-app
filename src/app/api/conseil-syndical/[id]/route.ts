import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  // Verify ownership via copropriete before delete
  const { data: membre } = await supabase
    .from('conseil_syndical')
    .select('id, copropriete:coproprietes(cabinet_id)')
    .eq('id', params.id)
    .single()

  if (!membre) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const membreCabinetId = (membre.copropriete as any)?.cabinet_id
  if (membreCabinetId !== profile.cabinet_id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { error } = await supabase.from('conseil_syndical').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
