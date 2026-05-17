import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, Download, FolderOpen } from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'
import { DOCUMENT_CATEGORY_LABELS } from '@/types'
import type { Document, DocumentCategory } from '@/types'
import { getSignedDocumentUrl } from '@/lib/storage'

const CATEGORY_ICONS: Record<DocumentCategory, string> = {
  pv_ag: '📋',
  budget: '💰',
  contrat: '📝',
  sinistre: '⚠️',
  appel_fonds: '💳',
  reglement: '📜',
  autre: '📄',
}

export default async function MesDocuments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles').select('lot_id').eq('id', user.id).single()

  const { data: documents } = await supabase
    .from('documents').select('*').eq('visible_coproprietaires', true)
    .or(`lot_id.eq.${profile?.lot_id ?? 'null'},lot_id.is.null`)
    .order('created_at', { ascending: false })

  const docsWithUrls = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const signed_url = await getSignedDocumentUrl(doc.storage_bucket ?? 'documents', doc.storage_path)
      return { ...doc, signed_url }
    })
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byCategorie = docsWithUrls.reduce<Record<string, any[]>>(
    (acc, doc) => {
      const cat = doc.categorie || 'autre'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(doc)
      return acc
    },
    {}
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Mes documents</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {docsWithUrls.length} document{docsWithUrls.length > 1 ? 's' : ''} disponible{docsWithUrls.length > 1 ? 's' : ''}
        </p>
      </div>

      {docsWithUrls.length === 0 ? (
        <div className="coplio-card text-center py-16">
          <div className="w-14 h-14 bg-coplio-bg rounded-full flex items-center justify-center mx-auto mb-3">
            <FolderOpen className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-medium text-coplio-text">Aucun document</p>
          <p className="text-sm text-muted-foreground mt-1">Votre syndic n&apos;a pas encore partagé de documents.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byCategorie).map(([cat, docs]) => (
            <div key={cat} className="coplio-card p-0 overflow-hidden">
              {/* Header catégorie */}
              <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-coplio-bg">
                <span className="text-base">{CATEGORY_ICONS[cat as DocumentCategory]}</span>
                <h2 className="font-semibold text-sm text-coplio-text">
                  {DOCUMENT_CATEGORY_LABELS[cat as DocumentCategory] || cat}
                </h2>
                <span className="ml-auto text-xs text-muted-foreground">{docs.length} document{docs.length > 1 ? 's' : ''}</span>
              </div>

              {/* Table */}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-6 py-3">Nom</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Taille</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-6 py-3">Télécharger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {docs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-coplio-bg/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-coplio-green-light rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-coplio-green" />
                          </div>
                          <p className="text-sm font-medium text-coplio-text">{doc.nom}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{formatDate(doc.created_at)}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {doc.taille_bytes ? formatFileSize(doc.taille_bytes) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {doc.signed_url ? (
                          <a
                            href={doc.signed_url}
                            download={doc.nom}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-coplio-green bg-coplio-green-light hover:bg-coplio-green hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" /> Télécharger
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-coplio-bg px-3 py-1.5 rounded-lg">
                            <Download className="w-3.5 h-3.5" /> Indisponible
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
