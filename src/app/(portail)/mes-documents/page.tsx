import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FolderOpen } from 'lucide-react'
import type { Document } from '@/types'
import { MesDocumentsClient } from './MesDocumentsClient'

export default async function MesDocuments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles').select('lot_id').eq('id', user.id).single()

  const { data: lotData } = profile?.lot_id
    ? await supabase.from('lots').select('id, copropriete_id').eq('id', profile.lot_id).single()
    : { data: null }

  const coproprieteId = (lotData as { id: string; copropriete_id: string } | null)?.copropriete_id

  const query = supabase
    .from('documents')
    .select('*')
    .eq('visible_coproprietaires', true)
    .order('created_at', { ascending: false })

  if (profile?.lot_id && coproprieteId) {
    query.or(`lot_id.eq.${profile.lot_id},and(lot_id.is.null,copropriete_id.eq.${coproprieteId})`)
  } else if (coproprieteId) {
    query.is('lot_id', null).eq('copropriete_id', coproprieteId)
  } else if (profile?.lot_id) {
    query.eq('lot_id', profile.lot_id)
  } else {
    return (
      <div className="max-w-3xl mx-auto py-4">
        <h1 className="text-2xl font-bold text-coplio-text mb-6">Mes documents</h1>
        <div className="bg-white rounded-2xl border border-border p-10 text-center shadow-sm">
          <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text">Aucun document</p>
          <p className="text-sm text-muted-foreground mt-1">Votre syndic n&apos;a pas encore partagé de documents.</p>
        </div>
      </div>
    )
  }

  const { data: documents } = await query.limit(200)

  // Pre-generate signed URLs
  const docsWithUrls = await Promise.all(
    (documents ?? []).map(async (doc) => {
      try {
        const { data } = await supabase.storage
          .from(doc.storage_bucket ?? 'documents')
          .createSignedUrl(doc.storage_path, 3600)
        return { ...doc, signed_url: data?.signedUrl ?? null }
      } catch {
        return { ...doc, signed_url: null }
      }
    })
  )

  return <MesDocumentsClient documents={docsWithUrls as (Document & { signed_url: string | null })[]} />
}
