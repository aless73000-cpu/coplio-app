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
  // ── KPIs individuels ──────────────────────────────────────────
  { id: 'kpi_coproprietes',   label: 'KPI — Copropriétés',    description: 'Nombre total de copropriétés gérées' },
  { id: 'kpi_lots',           label: 'KPI — Lots gérés',       description: 'Nombre total de lots dans le portefeuille' },
  { id: 'kpi_sinistres',      label: 'KPI — Sinistres',         description: 'Sinistres ouverts en cours' },
  { id: 'kpi_impayes',        label: 'KPI — Impayés',           description: 'Montant total des impayés' },
  { id: 'kpi_coproprietaires',label: 'KPI — Copropriétaires',  description: 'Nombre de copropriétaires enregistrés' },
  { id: 'kpi_portail',        label: 'KPI — Portail actif',     description: 'Copropriétaires avec accès portail' },
  { id: 'kpi_ag',             label: 'KPI — AG à venir',        description: 'Assemblées générales planifiées' },
  { id: 'kpi_recouvrement',   label: 'KPI — Recouvrement',      description: 'Taux de recouvrement global du cabinet' },
  // ── Autres blocs ─────────────────────────────────────────────
  { id: 'alertes_intelligentes', label: 'Alertes intelligentes',    description: 'Suggestions automatiques basées sur vos données' },
  { id: 'graphiques_finances',   label: 'Graphiques financiers',    description: 'Évolution mensuelle des encaissements et taux global' },
  { id: 'graphiques_copros',     label: 'Graphiques copropriétés',  description: 'Taux de recouvrement par copropriété et répartition des statuts' },
  { id: 'performance',           label: 'Performance cabinet',      description: 'Indicateurs de performance globale de votre cabinet' },
  { id: 'alertes_coproprietes',  label: 'Alertes copropriétés',     description: 'Liste des copropriétés nécessitant une attention particulière' },
  { id: 'sinistres',             label: 'Sinistres en cours',       description: 'Derniers sinistres déclarés non clôturés' },
  { id: 'ag',                    label: 'AG à venir',               description: 'Prochaines assemblées générales planifiées' },
  { id: 'actions_rapides',       label: 'Actions rapides',          description: 'Raccourcis vers les actions les plus fréquentes' },
]

// v2 : KPIs devenus individuels (v1 avait kpis_1 / kpis_2)
const KEY_PREFIX = 'coplio_dashboard_prefs_v2_'

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
