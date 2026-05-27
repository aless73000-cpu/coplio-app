'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Building2, Home, Users, AlertTriangle, CalendarDays, X, Loader2,
  Plus, Receipt, FileText, Sparkles, Settings, ArrowRight, Zap,
  FileSpreadsheet, Bell,
} from 'lucide-react'

type SearchResult = {
  type: 'copropriete' | 'lot' | 'coproprietaire' | 'sinistre' | 'assemblee'
  id: string
  label: string
  sub?: string
  href: string
}

type QuickAction = {
  id: string
  label: string
  description: string
  href: string
  icon: React.ElementType
  kbd?: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'new-ag',      label: 'Nouvelle assemblée générale',  description: 'Planifier une AG',             href: '/assemblees/new',       icon: CalendarDays,   kbd: 'A' },
  { id: 'new-sinistre',label: 'Nouveau sinistre',             description: 'Déclarer un sinistre',         href: '/sinistres/new',        icon: AlertTriangle,  kbd: 'S' },
  { id: 'new-appel',   label: 'Nouvel appel de charges',      description: 'Émettre un appel',             href: '/appels-charges/new',   icon: Receipt,        kbd: 'C' },
  { id: 'new-copro',   label: 'Nouvelle copropriété',         description: 'Ajouter un immeuble',          href: '/coproprietes/new',     icon: Building2 },
  { id: 'import',      label: 'Importer des copropriétaires', description: 'Import CSV',                   href: '/importer',             icon: FileSpreadsheet },
  { id: 'ia',          label: 'Rédiger avec l\'IA',           description: 'Convocation, mise en demeure…', href: '/ia',                  icon: Sparkles },
  { id: 'impayes',     label: 'Voir les impayés',             description: 'Relances & recouvrement',      href: '/impayes',              icon: Bell },
  { id: 'documents',   label: 'Documents',                    description: 'Bibliothèque GED',             href: '/documents',            icon: FileText },
  { id: 'parametres',  label: 'Paramètres',                   description: 'Configuration du cabinet',     href: '/parametres',           icon: Settings },
]

const TYPE_ICON = {
  copropriete:    Building2,
  lot:            Home,
  coproprietaire: Users,
  sinistre:       AlertTriangle,
  assemblee:      CalendarDays,
}

const TYPE_LABEL = {
  copropriete:    'Copropriété',
  lot:            'Lot',
  coproprietaire: 'Copropriétaire',
  sinistre:       'Sinistre',
  assemblee:      'AG',
}

export function GlobalSearch() {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef   = useRef<HTMLInputElement>(null)
  const router     = useRouter()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Focus + reset when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setSelected(0)
    }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setSelected(0)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), 220)
  }

  function navigate(href: string) {
    setOpen(false)
    router.push(href)
  }

  // Unified list for keyboard nav
  const isSearchMode = query.length >= 2
  const allItems = isSearchMode ? results : QUICK_ACTIONS

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      if (isSearchMode && results[selected]) navigate(results[selected].href)
      else if (!isSearchMode && QUICK_ACTIONS[selected]) navigate(QUICK_ACTIONS[selected].href)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors text-sm"
      >
        <Search className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">Rechercher…</span>
        <kbd className="text-xs bg-white/10 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
        style={{ maxHeight: '70vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          {loading
            ? <Loader2 className="w-4 h-4 text-[#374151] animate-spin flex-shrink-0" />
            : <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher ou taper une commande…"
            className="flex-1 text-sm text-slate-900 placeholder-slate-400 outline-none bg-transparent"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]) }}
              className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            className="text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded-md font-mono transition-colors"
          >
            esc
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 60px)' }}>
          {/* ── Quick Actions (query vide) ───────────────────── */}
          {!isSearchMode && (
            <>
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  Actions rapides
                </p>
              </div>
              <ul className="pb-2">
                {QUICK_ACTIONS.map((action, i) => {
                  const Icon = action.icon
                  const isSelected = selected === i
                  return (
                    <li key={action.id}>
                      <button
                        onMouseEnter={() => setSelected(i)}
                        onClick={() => navigate(action.href)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-[#374151] text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{action.label}</p>
                          <p className="text-xs text-slate-400">{action.description}</p>
                        </div>
                        <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 transition-opacity ${isSelected ? 'opacity-100 text-[#374151]' : 'opacity-0'}`} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {/* ── Search Results ───────────────────────────────── */}
          {isSearchMode && results.length > 0 && (
            <>
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Search className="w-3 h-3" />
                  Résultats
                </p>
              </div>
              <ul className="pb-2">
                {results.map((r, i) => {
                  const Icon = TYPE_ICON[r.type] ?? Search
                  const typeLabel = TYPE_LABEL[r.type] ?? r.type
                  const isSelected = selected === i
                  return (
                    <li key={r.id}>
                      <button
                        onMouseEnter={() => setSelected(i)}
                        onClick={() => navigate(r.href)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-[#374151] text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{r.label}</p>
                          {r.sub && <p className="text-xs text-slate-400 truncate">{r.sub}</p>}
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium ${
                          isSelected ? 'bg-[#374151]/15 text-[#374151]' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {typeLabel}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {/* ── Empty search state ───────────────────────────── */}
          {isSearchMode && !loading && results.length === 0 && (
            <div className="py-10 text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">Aucun résultat</p>
              <p className="text-xs text-slate-400 mt-1">Aucun élément trouvé pour &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
          <span><kbd className="font-mono bg-slate-100 px-1 rounded">↑↓</kbd> naviguer</span>
          <span><kbd className="font-mono bg-slate-100 px-1 rounded">↵</kbd> ouvrir</span>
          <span><kbd className="font-mono bg-slate-100 px-1 rounded">esc</kbd> fermer</span>
          {!isSearchMode && (
            <span className="ml-auto text-[10px] text-slate-300">Tapez pour rechercher</span>
          )}
        </div>
      </div>
    </div>
  )
}
