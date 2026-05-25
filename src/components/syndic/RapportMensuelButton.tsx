'use client'

import { useState } from 'react'
import { FileText, Loader2, ChevronDown } from 'lucide-react'

interface Copropriete {
  id: string
  nom: string
  ville?: string | null
  nb_lots: number | null
  montant_impayes: number | null
  statut: string | null
}

interface RapportData {
  coproprietes: Copropriete[]
  totalEmis: number
  totalRecouvre: number
  tauxGlobal: number
  cabinetNom: string
}

export function RapportMensuelButton({ data }: { data: RapportData }) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function generate(period: 'mois' | 'trimestre') {
    setLoading(true)
    setOpen(false)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })

      const TEXT   = '#1C1C1A'
      const MUTED  = '#888888'
      const GRAY   = '#F8F8F6'
      const RULE   = '#E0E0DC'
      const GREEN  = '#111827'
      const PAGE_W = 210
      const MARGIN = 20
      const CONTENT_W = PAGE_W - MARGIN * 2

      const now = new Date()
      const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      const today = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

      // ── Header neutre (cabinet branding) ──────────────────────
      const H = 24
      doc.setFillColor(GRAY)
      doc.rect(0, 0, PAGE_W, H, 'F')
      doc.setDrawColor(RULE)
      doc.setLineWidth(0.4)
      doc.line(0, H, PAGE_W, H)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(TEXT)
      doc.text(data.cabinetNom || 'Rapport de gestion', MARGIN, 14)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(MUTED)
      doc.text(`Généré le ${today}`, PAGE_W - MARGIN, 14, { align: 'right' })
      doc.setTextColor(TEXT)

      let y = 34

      // ── Titre ─────────────────────────────────────────────────
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(TEXT)
      doc.text(
        `Rapport ${period === 'mois' ? 'mensuel' : 'trimestriel'} — ${monthName}`,
        MARGIN, y
      )
      y += 10

      // ── KPIs globaux ──────────────────────────────────────────
      doc.setFillColor('#F7F6F2')
      doc.roundedRect(MARGIN, y, CONTENT_W, 24, 3, 3, 'F')

      const kpiW = CONTENT_W / 3
      const kpis = [
        { label: 'Charges émises', value: `${(data.totalEmis / 1000).toFixed(1)}k€` },
        { label: 'Charges recouvrées', value: `${(data.totalRecouvre / 1000).toFixed(1)}k€` },
        { label: 'Taux de recouvrement', value: `${data.tauxGlobal}%` },
      ]

      kpis.forEach((kpi, i) => {
        const x = MARGIN + i * kpiW + kpiW / 2
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(MUTED)
        doc.text(kpi.label, x, y + 7, { align: 'center' })
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(i === 2 && data.tauxGlobal >= 90 ? GREEN : i === 2 && data.tauxGlobal < 70 ? '#D04040' : TEXT)
        doc.text(kpi.value, x, y + 17, { align: 'center' })
      })

      y += 32

      // ── Tableau copropriétés ───────────────────────────────────
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(GREEN)
      doc.text('Portefeuille de copropriétés', MARGIN, y)
      y += 6

      // Table header
      const cols = [
        { label: 'Copropriété', x: MARGIN, w: 80 },
        { label: 'Ville', x: MARGIN + 80, w: 35 },
        { label: 'Lots', x: MARGIN + 115, w: 20 },
        { label: 'Impayés', x: MARGIN + 135, w: 30 },
        { label: 'Statut', x: MARGIN + 165, w: 25 },
      ]

      doc.setFillColor('#E8F3F0')
      doc.rect(MARGIN, y, CONTENT_W, 7, 'F')
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(GREEN)
      cols.forEach((col) => doc.text(col.label, col.x + 2, y + 5))
      y += 9

      // Table rows
      doc.setFont('helvetica', 'normal')
      const statutLabel: Record<string, string> = { a_jour: 'À jour', attention: 'Attention', urgent: 'Urgent' }
      const statutColor: Record<string, string> = { a_jour: GREEN, attention: '#E6A93A', urgent: '#D04040' }

      data.coproprietes.forEach((copro, i) => {
        if (y > 270) {
          doc.addPage()
          y = 20
        }

        if (i % 2 === 0) {
          doc.setFillColor('#FAFAF8')
          doc.rect(MARGIN, y - 1, CONTENT_W, 7, 'F')
        }

        doc.setTextColor(TEXT)
        doc.setFontSize(8)

        const nomTrunc = copro.nom.length > 30 ? copro.nom.slice(0, 29) + '…' : copro.nom
        doc.text(nomTrunc, cols[0].x + 2, y + 4)
        doc.text(copro.ville ?? '—', cols[1].x + 2, y + 4)
        doc.text(String(copro.nb_lots), cols[2].x + 2, y + 4)

        const montantImpayes = copro.montant_impayes ?? 0
        const impayes = montantImpayes > 0
          ? `${montantImpayes.toLocaleString('fr-FR')} €`
          : '—'
        doc.setTextColor(montantImpayes > 0 ? '#D04040' : MUTED)
        doc.text(impayes, cols[3].x + 2, y + 4)

        const statut = copro.statut ?? 'a_jour'
        doc.setTextColor(statutColor[statut] ?? MUTED)
        doc.setFont('helvetica', 'bold')
        doc.text(statutLabel[statut] ?? statut, cols[4].x + 2, y + 4)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(TEXT)

        y += 7
      })

      y += 8

      // ── Footer ────────────────────────────────────────────────
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(MUTED)
        doc.setDrawColor('#E5E5E5')
        doc.line(MARGIN, 286, PAGE_W - MARGIN, 286)
        doc.text(
          `${data.cabinetNom} · ${today} · Page ${i}/${pageCount}`,
          PAGE_W / 2, 290, { align: 'center' }
        )
      }

      const filename = `rapport_${now.toISOString().slice(0, 7)}.pdf`
      doc.save(filename)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-xl text-sm font-medium text-coplio-text hover:bg-coplio-bg transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <FileText className="w-4 h-4 text-muted-foreground" />}
        <span className="hidden sm:inline">Rapport PDF</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-border shadow-lg z-20 overflow-hidden">
          <button
            onClick={() => generate('mois')}
            className="w-full px-4 py-2.5 text-sm text-left hover:bg-coplio-bg transition-colors text-coplio-text"
          >
            Rapport mensuel
          </button>
          <button
            onClick={() => generate('trimestre')}
            className="w-full px-4 py-2.5 text-sm text-left hover:bg-coplio-bg transition-colors text-coplio-text border-t border-border"
          >
            Rapport trimestriel
          </button>
        </div>
      )}
    </div>
  )
}
