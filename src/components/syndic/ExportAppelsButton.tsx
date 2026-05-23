'use client'

import { useState } from 'react'
import { Download, FileText, ChevronDown, BookOpen, Loader2 } from 'lucide-react'
import { exportCSV, exportPDF } from '@/lib/export'
import { formatEuro, formatDate, getOverdueDays } from '@/lib/utils'
import { toast } from 'sonner'

interface Appel {
  id: string
  libelle: string
  montant: number
  montant_paye: number
  date_echeance: string
  date_appel: string
  paye: boolean
  copropriete?: { nom?: string }
  lot?: { numero?: string }
}

interface ExportAppelsButtonProps {
  appels: Appel[]
}

export function ExportAppelsButton({ appels }: ExportAppelsButtonProps) {
  const [open, setOpen] = useState(false)
  const [fecLoading, setFecLoading] = useState(false)

  async function handleFEC() {
    setOpen(false)
    setFecLoading(true)
    try {
      const annee = new Date().getFullYear()
      const res = await fetch(`/api/exports/fec?annee=${annee}`)
      if (!res.ok) throw new Error('Erreur export FEC')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `FEC_${annee}.txt`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export FEC téléchargé')
    } catch {
      toast.error('Erreur lors de l\'export FEC')
    } finally {
      setFecLoading(false)
    }
  }

  function handleCSV() {
    setOpen(false)
    exportCSV(
      appels.map((a) => ({
        Libellé: a.libelle,
        Copropriété: a.copropriete?.nom ?? '',
        Lot: a.lot?.numero ?? '',
        'Montant (€)': a.montant.toFixed(2),
        'Payé (€)': a.montant_paye.toFixed(2),
        'Restant (€)': (a.montant - a.montant_paye).toFixed(2),
        'Date appel': formatDate(a.date_appel),
        Échéance: formatDate(a.date_echeance),
        Statut: a.paye ? 'Payé' : new Date(a.date_echeance) < new Date() ? 'En retard' : 'En attente',
        'Retard (jours)': !a.paye ? getOverdueDays(a.date_echeance) : 0,
      })),
      'appels_charges'
    )
  }

  async function handlePDF() {
    setOpen(false)
    await exportPDF({
      title: 'Appels de charges',
      subtitle: `${appels.length} appel${appels.length > 1 ? 's' : ''}`,
      filename: 'appels_charges',
      columns: [
        { header: 'Libellé', key: 'libelle', width: 40 },
        { header: 'Copropriété', key: 'copropriete', width: 35 },
        { header: 'Lot', key: 'lot', width: 12 },
        { header: 'Montant', key: 'montant', width: 22 },
        { header: 'Échéance', key: 'echeance', width: 22 },
        { header: 'Statut', key: 'statut', width: 20 },
      ],
      rows: appels.map((a) => ({
        libelle: a.libelle,
        copropriete: a.copropriete?.nom ?? '',
        lot: a.lot?.numero ?? '',
        montant: formatEuro(a.montant),
        echeance: formatDate(a.date_echeance),
        statut: a.paye ? 'Payé' : new Date(a.date_echeance) < new Date() ? `J+${getOverdueDays(a.date_echeance)}` : 'En attente',
      })),
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm
                   text-coplio-text hover:bg-coplio-bg transition-colors"
      >
        <Download className="w-4 h-4" />
        Exporter
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-border rounded-xl shadow-lg z-20 overflow-hidden">
            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Exporter</p>
            <button
              onClick={handleCSV}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-coplio-bg transition-colors text-left"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              <div>
                <p className="font-medium text-coplio-text">CSV</p>
                <p className="text-[11px] text-muted-foreground">Tableau Excel / Sheets</p>
              </div>
            </button>
            <button
              onClick={handlePDF}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-coplio-bg transition-colors text-left"
            >
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <div>
                <p className="font-medium text-coplio-text">PDF</p>
                <p className="text-[11px] text-muted-foreground">Document imprimable</p>
              </div>
            </button>
            <div className="border-t border-border" />
            <button
              onClick={handleFEC}
              disabled={fecLoading}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-coplio-bg transition-colors text-left disabled:opacity-60"
            >
              {fecLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                : <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />}
              <div>
                <p className="font-medium text-coplio-text">FEC</p>
                <p className="text-[11px] text-muted-foreground">Comptabilité DGFiP</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
