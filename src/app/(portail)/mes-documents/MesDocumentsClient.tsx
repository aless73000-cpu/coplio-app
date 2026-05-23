'use client'

import { useState, useMemo } from 'react'
import { Search, Download, X, FolderOpen } from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'
import { DOCUMENT_CATEGORY_LABELS } from '@/types'
import type { Document, DocumentCategory } from '@/types'

const CATEGORY_ICONS: Record<string, string> = {
  pv_ag: '📋',
  budget: '💰',
  contrat: '📝',
  sinistre: '⚠️',
  appel_fonds: '💳',
  reglement: '📜',
  autre: '📄',
}

const CATEGORY_COLORS: Record<string, string> = {
  pv_ag: 'bg-blue-50 text-coplio-blue',
  budget: 'bg-green-50 text-green-700',
  contrat: 'bg-purple-50 text-purple-700',
  sinistre: 'bg-coplio-amber-bg text-coplio-amber',
  appel_fonds: 'bg-coplio-green-light text-coplio-green',
  reglement: 'bg-gray-100 text-gray-600',
  autre: 'bg-coplio-bg text-muted-foreground',
}

interface Props {
  documents: (Document & { signed_url: string | null })[]
}

function DocRow({
  doc,
  sevenDaysAgo,
}: {
  doc: Document & { signed_url: string | null }
  sevenDaysAgo: Date
}) {
  const cat = doc.categorie || 'autre'
  const isNew = doc.created_at != null && new Date(doc.created_at) > sevenDaysAgo
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-coplio-bg/50 transition-colors group">
      {/* Icon */}
      <div className="w-9 h-9 bg-coplio-bg rounded-xl flex items-center justify-center flex-shrink-0">
        <span className="text-base">{CATEGORY_ICONS[cat] ?? '📄'}</span>
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-coplio-text truncate">{doc.nom}</p>
          {isNew && (
            <span className="flex-shrink-0 text-[10px] font-bold text-coplio-green bg-coplio-green-light px-1.5 py-0.5 rounded-full">
              NOUVEAU
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${CATEGORY_COLORS[cat] ?? 'bg-coplio-bg text-muted-foreground'}`}>
            {DOCUMENT_CATEGORY_LABELS[cat as DocumentCategory] ?? cat}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(doc.created_at)}
          </span>
          {doc.taille_bytes != null && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              · {formatFileSize(doc.taille_bytes)}
            </span>
          )}
        </div>
      </div>
      {/* Download */}
      {doc.signed_url ? (
        <a
          href={doc.signed_url}
          target="_blank"
          rel="noopener noreferrer"
          download={doc.nom}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-coplio-green opacity-0 group-hover:opacity-100 bg-coplio-green-light px-3 py-1.5 rounded-lg transition-all hover:bg-coplio-green hover:text-white"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Télécharger</span>
        </a>
      ) : (
        <span className="flex-shrink-0 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Indisponible</span>
      )}
    </div>
  )
}

export function MesDocumentsClient({ documents }: Props) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const sevenDaysAgo = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), [])

  const categories = useMemo(() => {
    const cats = new Set(documents.map((d) => d.categorie || 'autre'))
    return ['all', ...Array.from(cats)]
  }, [documents])

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch = !search ||
        doc.nom.toLowerCase().includes(search.toLowerCase()) ||
        (doc.categorie && DOCUMENT_CATEGORY_LABELS[doc.categorie as DocumentCategory]?.toLowerCase().includes(search.toLowerCase()))
      const matchCat = selectedCategory === 'all' || (doc.categorie || 'autre') === selectedCategory
      return matchSearch && matchCat
    })
  }, [documents, search, selectedCategory])

  const newDocs = filtered.filter((d) => d.created_at != null && new Date(d.created_at) > sevenDaysAgo)
  const olderDocs = filtered.filter((d) => d.created_at == null || new Date(d.created_at) <= sevenDaysAgo)

  return (
    <div className="max-w-3xl mx-auto space-y-5 py-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Mes documents</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {documents.length} document{documents.length > 1 ? 's' : ''} disponible{documents.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un document…"
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground hover:text-coplio-text" />
            </button>
          )}
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-sm bg-white border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-coplio-green text-coplio-text cursor-pointer"
        >
          <option value="all">Toutes catégories</option>
          {categories.filter((c) => c !== 'all').map((cat) => (
            <option key={cat} value={cat}>
              {DOCUMENT_CATEGORY_LABELS[cat as DocumentCategory] ?? cat}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center shadow-sm">
          <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-coplio-text">Aucun document trouvé</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search
              ? `Aucun résultat pour "${search}"`
              : "Votre syndic n'a pas encore partagé de documents."
            }
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-3 text-sm text-coplio-green hover:underline"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* New documents section */}
          {newDocs.length > 0 && (
            <>
              <div className="px-5 py-3 bg-coplio-green-light/50 border-b border-coplio-green/10 flex items-center gap-2">
                <div className="w-2 h-2 bg-coplio-green rounded-full" />
                <span className="text-xs font-semibold text-coplio-green uppercase tracking-wide">
                  Nouveaux · {newDocs.length} doc{newDocs.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-border">
                {newDocs.map((doc) => (
                  <DocRow key={doc.id} doc={doc} sevenDaysAgo={sevenDaysAgo} />
                ))}
              </div>
            </>
          )}
          {/* Older documents */}
          {olderDocs.length > 0 && (
            <>
              {newDocs.length > 0 && (
                <div className="px-5 py-3 bg-coplio-bg border-y border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plus anciens</span>
                </div>
              )}
              <div className="divide-y divide-border">
                {olderDocs.map((doc) => (
                  <DocRow key={doc.id} doc={doc} sevenDaysAgo={sevenDaysAgo} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
