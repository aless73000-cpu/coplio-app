import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, Download, FolderOpen } from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'
import { DOCUMENT_CATEGORY_LABELS } from '@/types'
import type { Document, DocumentCategory } from '@/types'

export default async function MesDocuments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('lot_id')
    .eq('id', user.id)
    .single()

  // Documents visibles pour ce copropriétaire
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('visible_copropriétaires', true)
    .or(`lot_id.eq.${profile?.lot_id},lot_id.is.null`)
    .order('created_at', { ascending: false })

  const byCategorie = (documents ?? []).reduce<Record<string, Document[]>>((acc, doc) => {
    const cat = doc.categorie || 'autre'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(doc)
    return acc
  }, {})

  const CATEGORY_ICONS: Record<DocumentCategory, string> = {
    pv_ag: '📋',
    budget: '💰',
    contrat: '📝',
    sinistre: '⚠️',
    appel_fonds: '💳',
    reglement: '📜',
    autre: '📄',
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="bg-coplio-green px-6 pt-12 pb-6 text-white">
        <p className="text-white/70 text-sm mb-1">Documents</p>
        <h1 className="text-2xl font-bold">Mes documents</h1>
        <p className="text-white/70 text-sm mt-1">
          {documents?.length ?? 0} document{(documents?.length ?? 0) > 1 ? 's' : ''} disponible{(documents?.length ?? 0) > 1 ? 's' : ''}
        </p>
      </div>

      <div className="px-4 mt-6 space-y-5">
        {(!documents || documents.length === 0) ? (
          <div className="bg-white rounded-2xl border border-border p-8 text-center">
            <div className="w-14 h-14 bg-coplio-bg rounded-full flex items-center justify-center mx-auto mb-3">
              <FolderOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-medium text-coplio-text">Aucun document</p>
            <p className="text-sm text-muted-foreground mt-1">
              Votre syndic n&apos;a pas encore partagé de documents.
            </p>
          </div>
        ) : (
          Object.entries(byCategorie).map(([cat, docs]) => (
            <div key={cat} className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-coplio-bg">
                <span>{CATEGORY_ICONS[cat as DocumentCategory]}</span>
                <h2 className="font-semibold text-sm text-coplio-text">
                  {DOCUMENT_CATEGORY_LABELS[cat as DocumentCategory] || cat}
                </h2>
                <span className="ml-auto text-xs text-muted-foreground">{docs.length}</span>
              </div>

              <div className="divide-y divide-border">
                {docs.map((doc: Document) => (
                  <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-coplio-text truncate">{doc.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(doc.created_at)}
                        {doc.taille_bytes && ` · ${formatFileSize(doc.taille_bytes)}`}
                      </p>
                    </div>
                    <button
                      className="p-2 rounded-xl bg-coplio-green-light text-coplio-green hover:bg-coplio-green hover:text-white transition-colors flex-shrink-0"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
