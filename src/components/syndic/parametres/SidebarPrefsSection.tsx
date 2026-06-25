'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { VISIBLE_NAV_ITEMS, DEFAULT_PINNED_IDS } from '@/lib/nav-items'
import { useSidebarPrefs } from '@/hooks/useSidebarPrefs'

export function SidebarPrefsSection({ userId }: { userId: string }) {
  const { pinnedIds, setPinnedIds, hydrated } = useSidebarPrefs(userId)
  const [localPinned, setLocalPinned] = useState<string[]>(DEFAULT_PINNED_IDS)
  const [saved, setSaved] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (hydrated) setLocalPinned(pinnedIds)
  }, [hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  // Items configurables (non alwaysPinned)
  const configurableItems = VISIBLE_NAV_ITEMS.filter((item) => !item.alwaysPinned)
  const alwaysPinnedItems  = VISIBLE_NAV_ITEMS.filter((item) => item.alwaysPinned)

  function toggle(id: string) {
    setLocalPinned((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
    setSaved(false)
  }

  function handleSave() {
    // Toujours inclure les alwaysPinned
    const alwaysIds = alwaysPinnedItems.map((i) => i.id)
    const combined = [...alwaysIds, ...localPinned]
    const merged = combined.filter((id, idx) => combined.indexOf(id) === idx)
    setPinnedIds(merged)
    setSaved(true)
    toast.success('Sidebar enregistrée')
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <section className="coplio-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 text-[#374151]" />
          </div>
          <div className="text-left">
            <h2 className="font-semibold text-coplio-text">Ma Sidebar</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choisissez les raccourcis affichés dans votre menu
            </p>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="mt-5 space-y-4">
          {/* Items toujours épinglés */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Toujours visibles
            </p>
            <div className="space-y-1">
              {alwaysPinnedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-coplio-bg border border-border/50 opacity-60"
                >
                  <item.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-coplio-text">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">Fixe</span>
                </div>
              ))}
            </div>
          </div>

          {/* Items configurables */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Personnalisables — cochez ce que vous voulez voir
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Les éléments non cochés apparaîtront dans la section <strong>Autres</strong> de votre sidebar (accessible en un clic).
            </p>
            <div className="space-y-2">
              {!hydrated ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                configurableItems.map((item) => {
                  const isPinned = localPinned.includes(item.id)
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                        isPinned
                          ? 'bg-slate-100 border-[#374151]/30'
                          : 'bg-white border-border hover:border-[#374151]/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={() => toggle(item.id)}
                        className="w-4 h-4 rounded accent-[#374151] flex-shrink-0"
                      />
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${isPinned ? 'text-[#374151]' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isPinned ? 'text-[#374151]' : 'text-coplio-text'}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!hydrated}
            className="flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-60"
          >
            {saved && <CheckCircle2 className="w-4 h-4" />}
            {saved ? 'Enregistré !' : 'Enregistrer'}
          </button>
        </div>
      )}
    </section>
  )
}
