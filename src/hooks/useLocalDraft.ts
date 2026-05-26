'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Persiste automatiquement un objet dans localStorage.
 * - Restaure le draft au montage
 * - Sauvegarde à chaque changement de valeur
 * - `clearDraft()` supprime l'entrée (appeler après soumission réussie)
 */
export function useLocalDraft<T extends Record<string, string>>(
  key: string,
  initial: T
): { draft: T; setField: (field: keyof T, value: string) => void; clearDraft: () => void } {
  const [draft, setDraft] = useState<T>(initial)
  const [hydrated, setHydrated] = useState(false)

  // Restaurer depuis localStorage au premier montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<T>
        setDraft(prev => ({ ...prev, ...parsed }))
      }
    } catch {
      // localStorage indisponible (SSR, mode privé restrictif) — on ignore
    }
    setHydrated(true)
  }, [key])

  // Sauvegarder à chaque changement (seulement après hydratation pour éviter d'écraser)
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(key, JSON.stringify(draft))
    } catch {
      // quota dépassé ou mode privé — silencieux
    }
  }, [key, draft, hydrated])

  const setField = useCallback((field: keyof T, value: string) => {
    setDraft(prev => ({ ...prev, [field]: value }))
  }, [])

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key)
    } catch {
      // silencieux
    }
    setDraft(initial)
  }, [key, initial])

  return { draft, setField, clearDraft }
}
