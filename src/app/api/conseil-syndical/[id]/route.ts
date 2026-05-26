import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'

export const DELETE = withErrorHandler(async (_: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  // Authentification via client normal
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  // Lecture admin pour vérifier l'appartenance avant de supprimer
  const admin = createAdminClient()
  const { data: membre } = await admin
    .from('conseil_syndical')
    .select('id, copropriete:coproprietes(cabinet_id)')
    .eq('id', id)
    .single()

  if (!membre) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  const membreCabinetId = (membre.copropriete as unknown as { cabinet_id: string } | null)?.cabinet_id
  if (membreCabinetId !== profile.cabinet_id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // Suppression via admin
  const { error } = await admin.from('conseil_syndical').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
})
