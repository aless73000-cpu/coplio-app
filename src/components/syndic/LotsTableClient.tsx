'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X, Pencil } from 'lucide-react'
import { formatEuro } from '@/lib/utils'
import { LOT_TYPE_LABELS } from '@/types'

interface Lot {
  id: string
  numero: string
  type: string | null
  etage?: string | null
  surface?: number | null
  tantiemes: number
  solde_compte?: number | null
}

function typeLabel(type: string | null | undefined): string {
  if (!type) return '—'
  return LOT_TYPE_LABELS[type as keyof typeof LOT_TYPE_LABELS] ?? type
}

export function LotsTableClient({ lots }: { lots: Lot[] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const types = useMemo(
    () => Array.from(new Set(lots.map(l => l.type).filter((t): t is string => Boolean(t))))
      .sort((a, b) => typeLabel(a).localeCompare(typeLabel(b))),
    [lots],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return lots.filter(l => {
      if (typeFilter !== 'all' && l.type !== typeFilter) return false
      if (!q) return true
      return [l.numero, typeLabel(l.type), l.etage]
        .some(v => v?.toString().toLowerCase().includes(q))
    })
  }, [lots, search, typeFilter])

  const filtreActif = search.trim() !== '' || typeFilter !== 'all'

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un lot par numéro, type, étage…"
            className="w-full pl-9 pr-9 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]/20"
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Effacer la recherche"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-coplio-text">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {types.length > 1 && (
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#374151]/20 capitalize">
            <option value="all">Tous les types</option>
            {types.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
          </select>
        )}
        {filtreActif && (
          <div className="flex items-center text-sm text-muted-foreground px-1 whitespace-nowrap">
            {filtered.length} lot{filtered.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="coplio-card overflow-x-auto">
        {filtered.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium text-xs">Numéro</th>
                <th className="text-left py-2 text-muted-foreground font-medium text-xs">Type</th>
                <th className="text-left py-2 text-muted-foreground font-medium text-xs hidden md:table-cell">Étage</th>
                <th className="text-right py-2 text-muted-foreground font-medium text-xs hidden md:table-cell">Surface</th>
                <th className="text-right py-2 text-muted-foreground font-medium text-xs hidden md:table-cell">Tantièmes</th>
                <th className="text-right py-2 text-muted-foreground font-medium text-xs">Solde</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lot) => (
                <tr key={lot.id} className="border-b border-border hover:bg-coplio-bg transition-colors">
                  <td className="py-3">
                    <Link href={`/lots/${lot.id}`} className="font-medium text-[#374151] hover:underline">
                      Lot {lot.numero}
                    </Link>
                  </td>
                  <td className="py-3 text-muted-foreground capitalize">{typeLabel(lot.type)}</td>
                  <td className="py-3 text-muted-foreground hidden md:table-cell">{lot.etage ?? '—'}</td>
                  <td className="py-3 text-right text-muted-foreground hidden md:table-cell">{lot.surface ? `${lot.surface} m²` : '—'}</td>
                  <td className="py-3 text-right hidden md:table-cell">{lot.tantiemes}</td>
                  <td className={`py-3 text-right font-medium ${(lot.solde_compte ?? 0) < 0 ? 'text-red-500' : 'text-coplio-text'}`}>
                    {formatEuro(lot.solde_compte ?? 0)}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/lots/${lot.id}/edit`}
                      className="p-1.5 rounded-md hover:bg-border text-muted-foreground hover:text-coplio-text transition-colors inline-flex"
                      title="Modifier"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-10">
            <Search className="w-9 h-9 text-muted-foreground mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-coplio-text text-sm">Aucun lot trouvé</p>
            <p className="text-xs text-muted-foreground mt-1">Aucun lot ne correspond à votre recherche.</p>
          </div>
        )}
      </div>
    </div>
  )
}
