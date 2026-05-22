'use client'

import { useState } from 'react'
import { Send, Loader2, Download, FileText, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { RelanceButton } from './RelanceButton'
import { formatEuro, formatDate, getOverdueDays } from '@/lib/utils'
import { exportCSV, exportPDF } from '@/lib/export'
import type { AppelCharges, Lot, Copropriete } from '@/types'

type AppelWithDetails = AppelCharges & {
  lot?: Lot & { numero: string }
  copropriete?: Copropriete & { nom: string }
}

interface Props {
  impayes: AppelWithDetails[]
}

export function ImpayesTable({ impayes: initial }: Props) {
  const [items, setItems] = useState(initial)
  const [bulkLoading, setBulkLoading] = useState(false)

  function handleExportCSV() {
    exportCSV(
      items.map((a) => ({
        Copropriété: a.copropriete?.nom ?? '',
        Lot: a.lot?.numero ?? '',
        Libellé: a.libelle,
        'Montant dû (€)': (a.montant - a.montant_paye).toFixed(2),
        Échéance: formatDate(a.date_echeance),
        'Retard (jours)': getOverdueDays(a.date_echeance),
        Relances: a.nb_relances,
        'Dernière relance': a.derniere_relance_at ? formatDate(a.derniere_relance_at) : '',
      })),
      'impayes'
    )
  }

  async function handleExportPDF() {
    await exportPDF({
      title: 'Suivi des impayés',
      subtitle: `${items.length} dossier${items.length > 1 ? 's' : ''} impayé${items.length > 1 ? 's' : ''}`,
      filename: 'impayes',
      columns: [
        { header: 'Copropriété', key: 'copropriete', width: 35 },
        { header: 'Lot', key: 'lot', width: 15 },
        { header: 'Libellé', key: 'libelle', width: 40 },
        { header: 'Montant dû', key: 'montant', width: 25 },
        { header: 'Retard', key: 'retard', width: 18 },
        { header: 'Relances', key: 'relances', width: 18 },
      ],
      rows: items.map((a) => ({
        copropriete: a.copropriete?.nom ?? '',
        lot: a.lot?.numero ?? '',
        libelle: a.libelle,
        montant: formatEuro(a.montant - a.montant_paye),
        retard: `J+${getOverdueDays(a.date_echeance)}`,
        relances: a.nb_relances,
      })),
    })
  }

  function handleSuccess(id: string, newNbRelances: number) {
    setItems((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, nb_relances: newNbRelances, derniere_relance_at: new Date().toISOString() }
          : a
      )
    )
  }

  async function handlePayer(id: string) {
    if (!confirm('Marquer cet appel de charges comme intégralement payé ?')) return
    const res = await fetch(`/api/appels-charges/${id}/payer`, { method: 'PATCH' })
    if (res.ok) {
      setItems((prev) => prev.filter((a) => a.id !== id))
      toast.success('Appel de charges marqué payé')
    } else {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  async function handleRelanceTous() {
    setBulkLoading(true)
    let sent = 0
    let failed = 0

    // Relancer en séquence pour ne pas surcharger
    for (const appel of items) {
      try {
        const res = await fetch(`/api/impayes/${appel.id}/relancer`, { method: 'POST' })
        if (res.ok) {
          sent++
          setItems((prev) =>
            prev.map((a) =>
              a.id === appel.id
                ? { ...a, nb_relances: a.nb_relances + 1, derniere_relance_at: new Date().toISOString() }
                : a
            )
          )
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    setBulkLoading(false)
    if (sent > 0) toast.success(`${sent} relance${sent > 1 ? 's' : ''} envoyée${sent > 1 ? 's' : ''}`)
    if (failed > 0) toast.error(`${failed} échec${failed > 1 ? 's' : ''} (copropriétaires sans email ?)`)
  }

  return (
    <div className="coplio-card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-semibold text-coplio-text">Détail des impayés</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-coplio-bg border border-border text-coplio-text rounded-lg
                       text-xs font-medium hover:bg-border transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-coplio-bg border border-border text-coplio-text rounded-lg
                       text-xs font-medium hover:bg-border transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>
          <button
            onClick={handleRelanceTous}
            disabled={bulkLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-coplio-amber text-white rounded-lg
                       text-xs font-medium hover:bg-coplio-amber/90 transition-colors disabled:opacity-60"
          >
            {bulkLoading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Send className="w-3.5 h-3.5" />}
            {bulkLoading ? 'Envoi…' : 'Relancer tous'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Copropriété / Lot', 'Libellé', 'Montant dû', 'Retard', 'Relances', 'Actions'].map((h) => (
                <th key={h} className="text-left py-2 text-xs text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((appel) => {
              const overdue = getOverdueDays(appel.date_echeance)
              const restant = appel.montant - appel.montant_paye

              return (
                <tr key={appel.id} className="border-b border-border hover:bg-coplio-bg transition-colors">
                  <td className="py-3">
                    <p className="font-medium text-coplio-text">{appel.copropriete?.nom}</p>
                    <p className="text-xs text-muted-foreground">Lot {appel.lot?.numero}</p>
                  </td>
                  <td className="py-3 text-muted-foreground">{appel.libelle}</td>
                  <td className="py-3 font-bold text-coplio-red">{formatEuro(restant)}</td>
                  <td className="py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      overdue >= 90 ? 'badge-urgent' :
                      overdue >= 30 ? 'badge-attention' :
                      'bg-coplio-blue-bg text-coplio-blue'
                    }`}>
                      J+{overdue}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground text-center">
                    <span className="font-medium">{appel.nb_relances}</span>
                    {appel.derniere_relance_at && (
                      <p className="text-xs">{formatDate(appel.derniere_relance_at)}</p>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <RelanceButton
                        appelId={appel.id}
                        nbRelances={appel.nb_relances}
                        onSuccess={(n) => handleSuccess(appel.id, n)}
                      />
                      <button
                        onClick={() => handlePayer(appel.id)}
                        className="flex items-center gap-1 text-xs text-coplio-green font-medium hover:text-coplio-green/70 transition-colors"
                        title="Marquer payé"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Payé
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
