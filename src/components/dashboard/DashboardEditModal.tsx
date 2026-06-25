'use client'

import { useEffect, useRef, useState, type Dispatch, type SetStateAction, type ReactNode } from 'react'
import { BarChart2, Eye, EyeOff, GripHorizontal } from 'lucide-react'
import { Reorder } from 'framer-motion'
import { WIDGET_ICONS, WIDGET_LABELS } from './dashboard-widgets'

interface Props {
  editMode: boolean
  editOrder: string[]
  setEditOrder: Dispatch<SetStateAction<string[]>>
  editKpiOrder: string[]
  setEditKpiOrder: Dispatch<SetStateAction<string[]>>
  editVisible: Record<string, boolean>
  toggleVisibility: (id: string) => void
  onSave: () => void
  onCancel: () => void
  renderWidget: (id: string) => ReactNode
}

export function DashboardEditModal({
  editMode, editOrder, setEditOrder, editKpiOrder, setEditKpiOrder,
  editVisible, toggleVisibility, onSave, onCancel, renderWidget,
}: Props) {
  const [draggedKpi, setDraggedKpi] = useState<string | null>(null)
  const [dragOverKpi, setDragOverKpi] = useState<string | null>(null)
  const kpiDragSource = useRef<string | null>(null)
  const kpiLastTarget = useRef<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Ouvre/ferme le <dialog> natif en sync avec editMode
  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    if (editMode) {
      if (!dlg.open) dlg.showModal()
    } else {
      if (dlg.open) dlg.close()
    }
  }, [editMode])

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      style={{
        margin: 'auto',
        padding: 0,
        width: 'min(82vw, 1000px)',
        height: '90vh',
        border: 'none',
        borderRadius: 20,
        boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
        overflow: 'hidden',
        background: '#f8fafc',
        /* PAS de display:flex ici — le navigateur gère show/hide via display:none */
      }}
    >
      <style>{`
        dialog::backdrop { background: rgba(0,0,0,0.55); backdrop-filter: blur(6px); }
        dialog[open] { display: flex; flex-direction: column; }
      `}</style>

      {/* Contenu monté uniquement en mode édition actif — évite le rendu inutile des charts */}
      {editMode && <>

      {/* Barre du haut */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', background: '#fff',
        borderBottom: '1px solid #e2e8f0', flexShrink: 0,
      }}>
        <button onClick={onCancel} style={{ fontSize: 14, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 10 }}>
          Annuler
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: 0, letterSpacing: '-0.3px' }}>
            Personnaliser le tableau de bord
          </p>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
            Maintenez un bloc et glissez-le pour le déplacer
          </p>
        </div>
        <button onClick={onSave} style={{
          fontSize: 14, fontWeight: 700, color: '#fff',
          background: '#374151', border: 'none', cursor: 'pointer',
          padding: '7px 16px', borderRadius: 10,
        }}>
          Enregistrer
        </button>
      </div>

      {/* Corps — vrais widgets glissables */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
        <Reorder.Group axis="y" values={editOrder} onReorder={setEditOrder} as="div" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {editOrder.map((id) => {
            const Icon = WIDGET_ICONS[id] ?? BarChart2

            // ── Bloc spécial : groupe KPIs en grille 4 colonnes ──
            if (id === 'kpi_group') {
              return (
                <Reorder.Item
                  key="kpi_group" value="kpi_group"
                  style={{ listStyle: 'none', cursor: 'grab' }}
                  whileDrag={{ scale: 1.01, boxShadow: '0 16px 48px rgba(0,0,0,0.18)', zIndex: 50, borderRadius: 16 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Barre de drag du groupe */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 14px 7px 10px', background: '#fff',
                    borderRadius: '14px 14px 0 0',
                    border: '1px solid #e2e8f0', borderBottom: 'none',
                    userSelect: 'none',
                  }}>
                    <GripHorizontal style={{ width: 16, height: 16, color: '#cbd5e1', flexShrink: 0 }} />
                    <div style={{ width: 24, height: 24, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <BarChart2 style={{ width: 13, height: 13, color: '#64748b' }} />
                    </div>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                      Indicateurs clés — glissez ce bloc pour le déplacer
                    </span>
                  </div>

                  {/* Grille 4 colonnes des KPIs — drag HTML5 natif (stable sur grille) */}
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      border: '1px solid #e2e8f0', borderTop: 'none',
                      borderRadius: '0 0 14px 14px',
                      background: '#f8fafc', overflow: 'hidden',
                      padding: 14,
                    }}
                  >
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 10px', textAlign: 'center' }}>
                      Glissez les cartes pour les réorganiser
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      {editKpiOrder.map((kpiId) => {
                        const kpiVisible = editVisible[kpiId] ?? true
                        const isDragging = draggedKpi === kpiId
                        const isOver = dragOverKpi === kpiId && draggedKpi !== kpiId
                        return (
                          <div
                            key={kpiId}
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation()
                              kpiDragSource.current = kpiId
                              kpiLastTarget.current = null
                              setDraggedKpi(kpiId)
                              e.dataTransfer.effectAllowed = 'move'
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              const src = kpiDragSource.current
                              if (!src || src === kpiId) return
                              // Évite les déclenchements multiples sur le même target
                              if (kpiLastTarget.current === kpiId) return
                              kpiLastTarget.current = kpiId
                              setDragOverKpi(kpiId)
                              setEditKpiOrder((prev) => {
                                const arr = [...prev]
                                const from = arr.indexOf(src)
                                const to = arr.indexOf(kpiId)
                                if (from === -1 || to === -1) return prev
                                arr.splice(from, 1)
                                arr.splice(to, 0, src)
                                return arr
                              })
                            }}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                            onDragEnd={(e) => {
                              e.stopPropagation()
                              kpiDragSource.current = null
                              kpiLastTarget.current = null
                              setDraggedKpi(null)
                              setDragOverKpi(null)
                            }}
                            style={{
                              position: 'relative',
                              cursor: 'grab',
                              opacity: isDragging ? 0.4 : 1,
                              transition: 'opacity 0.15s, transform 0.15s',
                              transform: isOver ? 'scale(1.04)' : 'scale(1)',
                              outline: isOver ? '2px solid #374151' : 'none',
                              borderRadius: 12,
                            }}
                          >
                            {/* Aperçu KPI */}
                            <div style={{
                              pointerEvents: 'none', userSelect: 'none',
                              opacity: kpiVisible ? 1 : 0.3,
                              transition: 'opacity 0.2s',
                              background: '#fff',
                              border: '1px solid #e2e8f0',
                              borderRadius: 12,
                              overflow: 'hidden',
                            }}>
                              {renderWidget(kpiId)}
                            </div>
                            {/* Bouton œil */}
                            <button
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); toggleVisibility(kpiId) }}
                              title={kpiVisible ? 'Masquer' : 'Afficher'}
                              style={{
                                position: 'absolute', top: 6, right: 6,
                                width: 24, height: 24,
                                borderRadius: 8, border: 'none',
                                background: kpiVisible ? 'rgba(241,245,249,0.9)' : 'rgba(254,226,226,0.9)',
                                backdropFilter: 'blur(4px)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                zIndex: 10,
                              }}>
                              {kpiVisible
                                ? <Eye style={{ width: 12, height: 12, color: '#64748b' }} />
                                : <EyeOff style={{ width: 12, height: 12, color: '#dc2626' }} />
                              }
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Reorder.Item>
              )
            }

            // ── Bloc standard ──
            const visible = editVisible[id] ?? true
            const content = renderWidget(id)
            return (
              <Reorder.Item
                key={id} value={id} style={{ listStyle: 'none', cursor: 'grab' }}
                whileDrag={{ scale: 1.01, boxShadow: '0 16px 48px rgba(0,0,0,0.18)', zIndex: 50, borderRadius: 16 }}
                transition={{ duration: 0.15 }}
              >
                <div style={{ opacity: visible ? 1 : 0.35, transition: 'opacity 0.2s' }}>
                  {/* Barre de drag au-dessus du widget */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 14px 7px 10px',
                    background: '#fff',
                    borderRadius: '14px 14px 0 0',
                    border: '1px solid #e2e8f0', borderBottom: 'none',
                    userSelect: 'none',
                  }}>
                    <GripHorizontal style={{ width: 16, height: 16, color: '#cbd5e1', flexShrink: 0 }} />
                    <div style={{ width: 24, height: 24, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon style={{ width: 13, height: 13, color: '#64748b' }} />
                    </div>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                      {WIDGET_LABELS[id]}
                    </span>
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(id) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 8, border: 'none',
                        background: visible ? '#f1f5f9' : '#fee2e2',
                        cursor: 'pointer', fontSize: 11, fontWeight: 600,
                        color: visible ? '#64748b' : '#dc2626',
                      }}>
                      {visible
                        ? <><Eye style={{ width: 13, height: 13 }} /> Visible</>
                        : <><EyeOff style={{ width: 13, height: 13 }} /> Masqué</>
                      }
                    </button>
                  </div>

                  {/* Contenu réel du widget — pointer-events-none pour éviter les clics accidentels */}
                  <div style={{
                    pointerEvents: 'none', userSelect: 'none',
                    border: '1px solid #e2e8f0', borderTop: 'none',
                    borderRadius: '0 0 14px 14px',
                    background: '#fff', overflow: 'hidden',
                    padding: content ? 0 : '20px 16px',
                  }}>
                    {content
                      ? <div style={{ padding: 14 }}>{content}</div>
                      : <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                          Aucune donnée pour l&apos;instant
                        </p>
                    }
                  </div>
                </div>
              </Reorder.Item>
            )
          })}
        </Reorder.Group>
      </div>

      </> /* fin du bloc editMode */}
    </dialog>
  )
}
