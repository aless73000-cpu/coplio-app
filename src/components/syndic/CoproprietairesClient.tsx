'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { User, Mail, Phone, Search, ArrowUpAZ, ArrowDownAZ } from 'lucide-react'

interface Coproprietaire {
  id: string
  prenom: string
  nom: string
  email?: string
  telephone?: string
  portail_actif?: boolean
}

export function CoproprietairesClient({ data }: { data: Coproprietaire[] }) {
  const [search, setSearch] = useState('')
  const [sortAsc, setSortAsc] = useState(true)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const result = data.filter(c => {
      if (!q) return true
      return (
        c.nom?.toLowerCase().includes(q) ||
        c.prenom?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.telephone?.includes(q)
      )
    })
    result.sort((a, b) => {
      const nameA = `${a.nom} ${a.prenom}`.toLowerCase()
      const nameB = `${b.nom} ${b.prenom}`.toLowerCase()
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
    return result
  }, [data, search, sortAsc])

  return (
    <>
      {/* Barre de recherche + tri */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-coplio-green"
          />
        </div>
        <button
          onClick={() => setSortAsc(v => !v)}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-border bg-white rounded-lg hover:bg-coplio-bg transition-colors text-coplio-text"
          title={sortAsc ? 'Tri A → Z' : 'Tri Z → A'}
        >
          {sortAsc ? <ArrowUpAZ className="w-4 h-4" /> : <ArrowDownAZ className="w-4 h-4" />}
          A–Z
        </button>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Link key={c.id} href={`/coproprietaires/${c.id}`} className="coplio-card hover:border-coplio-green/30 transition-colors block">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-coplio-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-coplio-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-coplio-text">{c.prenom} {c.nom}</p>
                    {c.portail_actif && (
                      <span className="text-xs bg-coplio-green-light text-coplio-green px-1.5 py-0.5 rounded-full">Portail</span>
                    )}
                  </div>
                  <div className="mt-1 space-y-1">
                    {c.email && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        {c.email}
                      </p>
                    )}
                    {c.telephone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        {c.telephone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="coplio-card text-center py-12">
          <p className="text-muted-foreground text-sm">Aucun résultat pour &ldquo;{search}&rdquo;</p>
        </div>
      )}
    </>
  )
}
