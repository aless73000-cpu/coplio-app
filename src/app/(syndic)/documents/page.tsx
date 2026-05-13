import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Upload, FolderOpen } from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'
import { DOCUMENT_CATEGORY_LABELS } from '@/types'
import type { Document, DocumentCategory } from '@/types'
import { DocumentActions } from '@/components/syndic/DocumentActions'
import { DocTabs } from '@/components/syndic/DocTabs'

const CATEGORY_ICONS: Record<DocumentCategory, string> = {
  pv_ag: '📋',
  budget: '💰',
  contrat: '📝',
  sinistre: '⚠️',
  appel_fonds: '💳',
  reglement: '📜',
  autre: '📄',
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { categorie?: string; copropriete?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()

  // Use admin client to bypass RLS on documents table (no SELECT policy)
  const admin = createAdminClient()

  const [{ data: documents }, { data: coproprietes }] = await Promise.all([
    (() => {
      let q = admin
        .from('documents')
        .select('*, copropriete:coproprietes(nom)')
        .eq('cabinet_id', profile?.cabinet_id ?? '')
        .order('created_at', { ascending: false })

      if (searchParams.categorie && searchParams.categorie !== 'all') {
        q = q.eq('categorie', searchParams.categorie)
      }
      if (searchParams.copropriete) {
        q = q.eq('copropriete_id', searchParams.copropriete)
      }
      return q
    })(),
    supabase
      .from('coproprietes')
      .select('id, nom')
      .eq('cabinet_id', profile?.cabinet_id ?? '')
      .order('nom'),
  ])

  // Grouper par catégorie
  const byCategorie = (documents ?? []).reduce<Record<string, Document[]>>((acc, doc) => {
    const cat = doc.categorie || 'autre'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(doc)
    return acc
  }, {})

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {documents?.length ?? 0} document{(documents?.length ?? 0) > 1 ? 's' : ''} dans la GED
          </p>
        </div>
        <Link
          href="/documents/upload"
          className="flex items-center gap-2 bg-coplio-green text-white px-4 py-2.5 rounded-lg
                     text-sm font-medium hover:bg-coplio-green/90 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Importer
        </Link>
      </div>

      <DocTabs />

      {/* Filtres par catégorie */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/documents"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            !searchParams.categorie || searchParams.categorie === 'all'
              ? 'bg-coplio-green text-white border-coplio-green'
              : 'bg-white text-coplio-text border-border hover:border-coplio-green/30'
          }`}
        >
          Tous
        </Link>
        {(Object.keys(DOCUMENT_CATEGORY_LABELS) as DocumentCategory[]).map((cat) => (
          <Link
            key={cat}
            href={`/documents?categorie=${cat}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              searchParams.categorie === cat
                ? 'bg-coplio-green text-white border-coplio-green'
                : 'bg-white text-coplio-text border-border hover:border-coplio-green/30'
            }`}
          >
            <span>{CATEGORY_ICONS[cat]}</span>
            {DOCUMENT_CATEGORY_LABELS[cat]}
          </Link>
        ))}
      </div>

      {/* Contenu */}
      {(!documents || documents.length === 0) ? (
        <div className="coplio-card text-center py-16">
          <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-coplio-text mb-2">Aucun document</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Importez vos PV d&apos;AG, budgets, contrats et autres documents.
          </p>
          <Link
            href="/documents/upload"
            className="inline-flex items-center gap-2 bg-coplio-green text-white px-6 py-2.5 rounded-lg
                       text-sm font-medium hover:bg-coplio-green/90 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importer des documents
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategorie).map(([cat, docs]) => (
            <div key={cat} className="coplio-card">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{CATEGORY_ICONS[cat as DocumentCategory]}</span>
                <h2 className="font-semibold text-coplio-text">
                  {DOCUMENT_CATEGORY_LABELS[cat as DocumentCategory] || cat}
                </h2>
                <span className="bg-coplio-bg text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                  {docs.length}
                </span>
              </div>

              <div className="space-y-1">
                {docs.map((doc: Document & { copropriete?: { nom: string } }) => (
                  <DocumentRow key={doc.id} document={doc} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentRow({ document: doc }: {
  document: Document & { copropriete?: { nom: string } }
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-coplio-bg transition-colors group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-coplio-text truncate">{doc.nom}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            {doc.copropriete?.nom && <span>{doc.copropriete.nom}</span>}
            {doc.copropriete?.nom && <span>·</span>}
            <span>{formatDate(doc.created_at)}</span>
            {doc.taille_bytes && (
              <>
                <span>·</span>
                <span>{formatFileSize(doc.taille_bytes)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <DocumentActions documentId={doc.id} typeMime={doc.type_mime} />
      </div>
    </div>
  )
}
