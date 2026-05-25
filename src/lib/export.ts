/**
 * Utilitaires d'export CSV et PDF côté client
 */

// ─── CSV ───────────────────────────────────────────────────────────

type CSVRow = Record<string, string | number | boolean | null | undefined>

export function exportCSV(rows: CSVRow[], filename: string) {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(';'),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? ''
          const str = String(val).replace(/"/g, '""')
          return str.includes(';') || str.includes('"') || str.includes('\n')
            ? `"${str}"`
            : str
        })
        .join(';')
    ),
  ]

  const bom = '﻿' // BOM pour Excel FR
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── PDF ───────────────────────────────────────────────────────────

interface PDFTableOptions {
  title: string
  subtitle?: string
  columns: { header: string; key: string; width?: number }[]
  rows: CSVRow[]
  filename: string
}

export async function exportPDF({ title, subtitle, columns, rows, filename }: PDFTableOptions) {
  // Import dynamique pour éviter le SSR
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // ─── Header ───
  doc.setFillColor(17, 24, 39) // anthracite
  doc.rect(0, 0, 210, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Coplio', 14, 12)

  // ─── Titre ───
  doc.setTextColor(68, 68, 65)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 32)

  if (subtitle) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 120, 120)
    doc.text(subtitle, 14, 39)
  }

  // ─── Date génération ───
  doc.setFontSize(8)
  doc.setTextColor(160, 160, 160)
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  doc.text(`Généré le ${dateStr}`, 196, 32, { align: 'right' })

  // ─── Table ───
  autoTable(doc, {
    startY: subtitle ? 45 : 38,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => String(row[c.key] ?? ''))),
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: [68, 68, 65],
    },
    headStyles: {
      fillColor: [15, 110, 86],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [241, 239, 232],
    },
    columnStyles: columns.reduce((acc, col, i) => {
      if (col.width) acc[i] = { cellWidth: col.width }
      return acc
    }, {} as Record<number, { cellWidth: number }>),
    margin: { left: 14, right: 14 },
  })

  // ─── Footer ───
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.text(`Page ${i} / ${pageCount}`, 196, 290, { align: 'right' })
    doc.text('coplio.fr', 14, 290)
  }

  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`)
}
