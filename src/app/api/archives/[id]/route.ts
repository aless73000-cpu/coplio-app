import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'

export const DELETE = withErrorHandler(async (_request: Request, { params }: { params: { id: string } }) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  const admin = createAdminClient()

  // Vérifier rétention légale ET appartenance au cabinet en une seule requête
  const { data: archive } = await admin
    .from('archives')
    .select('retention_jusqu_au, cabinet_id')
    .eq('id', params.id)
    .single()

  if (!archive || archive.cabinet_id !== profile.cabinet_id) {
    return NextResponse.json({ error: 'Non trouvé ou accès refusé' }, { status: 404 })
  }

  if (new Date(archive.retention_jusqu_au) > new Date()) {
    return NextResponse.json({
      error: `Document sous rétention légale jusqu'au ${new Date(archive.retention_jusqu_au).toLocaleDateString('fr-FR')}`,
    }, { status: 403 })
  }

  const { error } = await admin.from('archives').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
})
