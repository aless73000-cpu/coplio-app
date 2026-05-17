import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getSignedDocumentUrl } from '@/lib/storage'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const admin = createAdminClient()
    const { data: doc } = await admin
      .from('documents')
      .select('storage_path, storage_bucket, nom, type_mime')
      .eq('id', params.id)
      .single()

    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    const url = await getSignedDocumentUrl(doc.storage_bucket ?? 'documents', doc.storage_path)
    if (!url) return NextResponse.json({ error: 'Erreur génération URL' }, { status: 500 })

    return NextResponse.json({ url, nom: doc.nom, type_mime: doc.type_mime })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
