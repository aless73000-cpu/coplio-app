'use client'

import { useState, useEffect, useCallback } from 'react'

export interface WidgetDef {
  id: string
  label: string
  description: string
}

export interface WidgetPref {
  id: string
  visible: boolean
}

export const ALL_WIDGETS: WidgetDef[] = [
  {
    id: 'kpis_1',
    label: 'KPIs principaux',
    description: 'Copropriétés, lots gérés, sinistres ouverts, impayés',
  },
  {
    id: 'kpis_2',
    label: 'KPIs secondaires',
    description: 'Copropriétaires, portail actif, AG à venir, taux recouvrement',
  },
  {
    id: 'alertes_intelligentes',
    label: 'Alertes intelligentes',
    description: 'Suggestions automatiques basées sur vos données',
  },
  {
    id: 'graphiques_finances',
    label: 'Graphiques financiers',
    description: 'Évolution mensuelle des encaissements et taux global',
  },
  {
    id: 'graphiques_copros',
    label: 'Graphiques copropriétés',
    description: 'Taux de recouvrement par copropriété et répartition des statuts',
  },
  {
    id: 'performance',
    label: 'Performance cabinet',
    description: 'Indicateurs de performance globale de votre cabinet',
  },
  {
    id: 'alertes_coproprietes',
    label: 'Alertes copropriétés',
    description: 'Liste des copropriétés nécessitant une attention particulière',
  },
  {
    id: 'sinistres',
    label: 'Sinistres en cours',
    description: 'Derniers sinistres déclarés non clôturés',
  },
  {
    id: 'ag',
    label: 'AG à venir',
    description: 'Prochaines assemblées générales planifiées',
  },
  {
    id: 'actions_rapides',
    label: 'Actions rapides',
    description: 'Raccourcis vers les actions les plus fréquentes',
  },
]

const KEY_PREFIX = 'coplio_dashboard_prefs_v1_'

/** Retourne la liste ordonnée des widgets avec leur état de visibilité */
export function useDashboardPrefs(userId: string) {
  const storageKey = KEY_PREFIX + userId

  const [widgets, setWidgetsState] = useState<WidgetPref[]>(
    ALL_WIDGETS.map((w) => ({ id: w.id, visible: true })),
  )
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const stored: WidgetPref[] = JSON.parse(raw)
        if (Array.isArray(stored) && stored.length > 0) {
          // Fusionner : conserver l'ordre stocké, ajouter nouveaux widgets en fin
          const storedIds = new Set(stored.map((w) => w.id))
          const merged: WidgetPref[] = [
            ...stored.filter((sw) => ALL_WIDGETS.some((w) => w.id === sw.id)),
            ...ALL_WIDGETS.filter((w) => !storedIds.has(w.id)).map((w) => ({
              id: w.id,
              visible: true,
            })),
          ]
          setWidgetsState(merged)
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [storageKey])

  const saveWidgets = useCallback(
    (newPrefs: WidgetPref[]) => {
      setWidgetsState(newPrefs)
      try {
        localStorage.setItem(storageKey, JSON.stringify(newPrefs))
      } catch {
        // ignore
      }
    },
    [storageKey],
  )

  return { widgets, saveWidgets, hydrated }
}
