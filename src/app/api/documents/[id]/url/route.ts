import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { withErrorHandler } from '@/lib/api-handler'

export const GET = withErrorHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const limit = await rateLimit(`doc-url:${user.id}`, { max: 120, windowMs: 60 * 1000 })
  if (!limit.success) return rateLimitResponse(limit.resetAt)

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })

  const admin = createAdminClient()
  const { data: doc } = await admin
    .from('documents')
    .select('storage_path, storage_bucket, nom, type_mime, cabinet_id, visible_coproprietaires')
    .eq('id', id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  // Syndic must own the document's cabinet
  // Coproprietaire (owner_resident) can only access documents marked visible
  const isSyndic = profile.role === 'owner' || profile.role === 'manager'
  if (isSyndic) {
    if (doc.cabinet_id !== profile.cabinet_id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
  } else {
    // Portail coproprietaire: document must be in their cabinet and visible
    if (doc.cabinet_id !== profile.cabinet_id || !doc.visible_coproprietaires) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
  }

  const { data, error } = await admin.storage
    .from(doc.storage_bucket ?? 'documents')
    .createSignedUrl(doc.storage_path, 60 * 60) // 1h

  if (error || !data?.signedUrl) return NextResponse.json({ error: 'Erreur génération URL' }, { status: 500 })

  return NextResponse.json({ url: data.signedUrl, nom: doc.nom, type_mime: doc.type_mime })
})
