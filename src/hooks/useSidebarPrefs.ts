'use client'

import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_PINNED_IDS } from '@/lib/nav-items'

const KEY_PREFIX = 'coplio_sidebar_prefs_v1_'

export function useSidebarPrefs(userId: string) {
  const storageKey = KEY_PREFIX + userId
  const [pinnedIds, setPinnedIdsState] = useState<string[]>(DEFAULT_PINNED_IDS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
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
  }, [storageKey])

  const setPinnedIds = useCallback(
    (ids: string[]) => {
      setPinnedIdsState(ids)
      try {
        localStorage.setItem(storageKey, JSON.stringify(ids))
      } catch {
        // ignore
      }
    },
    [storageKey],
  )

  return { pinnedIds, setPinnedIds, hydrated }
}
