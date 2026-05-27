'use client'

import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_PINNED_IDS } from '@/lib/nav-items'

const KEY_PREFIX = 'coplio_sidebar_prefs_v1_'

// Événement custom : toutes les instances du hook sur la même page l'écoutent
const SYNC_EVENT = 'coplio:sidebar-prefs-changed'

export function useSidebarPrefs(userId: string) {
  const storageKey = KEY_PREFIX + userId
  const [pinnedIds, setPinnedIdsState] = useState<string[]>(DEFAULT_PINNED_IDS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Hydratation initiale depuis localStorage
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPinnedIdsState(parsed)
        }
      }
    } catch {
      // localStorage indisponible ou JSON invalide
    }
    setHydrated(true)

    // Écouter les changements émis par les autres instances du hook (même page)
    function onSyncEvent(e: Event) {
      const { key, ids } = (e as CustomEvent<{ key: string; ids: string[] }>).detail
      if (key === storageKey) {
        setPinnedIdsState(ids)
      }
    }

    window.addEventListener(SYNC_EVENT, onSyncEvent)
    return () => window.removeEventListener(SYNC_EVENT, onSyncEvent)
  }, [storageKey])

  const setPinnedIds = useCallback(
    (ids: string[]) => {
      setPinnedIdsState(ids)
      try {
        localStorage.setItem(storageKey, JSON.stringify(ids))
      } catch {
        // ignore
      }
      // Notifier toutes les autres instances sur la même page
      window.dispatchEvent(
        new CustomEvent(SYNC_EVENT, { detail: { key: storageKey, ids } }),
      )
    },
    [storageKey],
  )

  return { pinnedIds, setPinnedIds, hydrated }
}
