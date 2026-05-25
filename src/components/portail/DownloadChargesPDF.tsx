'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

export interface ChargeRow {
  libelle: string
  date_appel: string
  date_echeance: string
  montant: number
  montant_paye: number
  paye: boolean
}

interface Props {
  charges: ChargeRow[]
  lotNumero: string
  coproprieteNom: string
  prenom: string
  nom: string
}

export function DownloadChargesPDF({ charges, lotNumero, coproprieteNom, prenom, nom }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      // ── En-tête ────────────────────────────────────────────────
      doc.setFillColor(17, 24, 39) // anthracite #374151
      doc.rect(0, 0, 210, 38, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('Coplio', 14, 16)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Historique de vos charges', 14, 24)

      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255, 0.8)
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 32)

      // ── Infos copropriétaire ───────────────────────────────────
      doc.setTextColor(68, 68, 65)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`${prenom} ${nom}`, 14, 50)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.text(`${coproprieteNom} · Lot ${lotNumero}`, 14, 57)

      // ── Résumé ─────────────────────────────────────────────────
      const totalDu = charges.reduce((s, c) => (!c.paye ? s + (c.montant - c.montant_paye) : s), 0)
      const totalPaye = charges.reduce((s, c) => s + c.montant_paye, 0)
      const totalAnnuel = charges
        .filter(c => new Date(c.date_appel).getFullYear() === new Date().getFullYear())
        .reduce((s, c) => s + c.montant, 0)

      const fmtEuro = (n: number) =>
        n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

      // Boîtes résumé
      const boxes = [
        { label: 'Solde à régler', value: fmtEuro(totalDu), color: totalDu > 0 ? [163, 45, 45] : [15, 110, 86] },
        { label: 'Total réglé', value: fmtEuro(totalPaye), color: [15, 110, 86] },
        { label: `Charges ${new Date().getFullYear()}`, value: fmtEuro(totalAnnuel), color: [68, 68, 65] },
      ]

      let bx = 14
      for (const box of boxes) {
        doc.setFillColor(245, 243, 237)
        doc.roundedRect(bx, 64, 56, 20, 2, 2, 'F')
        doc.setTextColor(box.color[0], box.color[1], box.color[2])
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(box.value, bx + 4, 76)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(120, 120, 120)
        doc.text(box.label, bx + 4, 80)
        bx += 60
      }

      // ── Tableau ────────────────────────────────────────────────
      const rows = charges.map(c => [
        c.libelle,
        new Date(c.date_appel).toLocaleDateString('fr-FR'),
        new Date(c.date_echeance).toLocaleDateString('fr-FR'),
        fmtEuro(c.montant),
        fmtEuro(c.montant_paye),
        c.paye ? 'Réglé' : new Date(c.date_echeance) < new Date() ? 'En retard' : 'En attente',
      ])

      autoTable(doc, {
        startY: 92,
        head: [['Libellé', 'Appel', 'Échéance', 'Montant', 'Réglé', 'Statut']],
        body: rows,
        styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
        headStyles: { fillColor: [15, 110, 86], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 243, 237] },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 24, halign: 'center' },
          2: { cellWidth: 24, halign: 'center' },
          3: { cellWidth: 26, halign: 'right' },
          4: { cellWidth: 26, halign: 'right' },
          5: { cellWidth: 24, halign: 'center' },
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            const val = data.cell.text[0]
            if (val === 'Réglé') {
              doc.setTextColor(15, 110, 86)
            } else if (val === 'En retard') {
              doc.setTextColor(163, 45, 45)
            } else {
              doc.setTextColor(133, 79, 11)
            }
          }
        },
      })

      // ── Pied de page ───────────────────────────────────────────
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(180, 180, 180)
        doc.text(
          `Coplio — Document généré automatiquement — Page ${i}/${pageCount}`,
          105, 290, { align: 'center' }
        )
      }

      doc.save(`charges-${lotNumero}-${new Date().toISOString().split('T')[0]}.pdf`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading || charges.length === 0}
      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-xl text-sm font-medium text-coplio-text hover:border-[#374151] hover:text-[#374151] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <Download className="w-4 h-4" />
      }
      {loading ? 'Génération...' : 'Télécharger PDF'}
    </button>
  )
}
