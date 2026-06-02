// ═══════════════════════════════════════════════════════════════
// COPLIO — Helper d'export multi-format
// Permet de produire un même jeu de données en TXT (délimité),
// CSV (Excel-friendly avec BOM) ou XLSX (vrai fichier Excel).
// ═══════════════════════════════════════════════════════════════

import ExcelJS from 'exceljs'

export type ExportFormat = 'txt' | 'csv' | 'xlsx'

const FORMATS: ExportFormat[] = ['txt', 'csv', 'xlsx']

/** Valide/normalise le paramètre ?format= ; retombe sur `fallback` si invalide. */
export function parseFormat(value: string | null, fallback: ExportFormat): ExportFormat {
  const v = (value ?? '').toLowerCase()
  return (FORMATS as string[]).includes(v) ? (v as ExportFormat) : fallback
}

interface BuildExportInput {
  header: string[]
  rows: (string | number | null)[][]
  /** Délimiteur pour le format TXT (FEC = '|'). Défaut '|'. */
  txtDelimiter?: string
  /** Nom de l'onglet Excel. */
  sheetName?: string
  /** Lignes de bas de tableau (totaux) — ajoutées telles quelles. */
  footerRows?: (string | number | null)[][]
}

export interface BuiltExport {
  body: string | Buffer
  contentType: string
  extension: ExportFormat
}

const cell = (v: string | number | null): string => (v === null || v === undefined ? '' : String(v))

/** Construit le corps du fichier d'export dans le format demandé. */
export async function buildExport(
  format: ExportFormat,
  { header, rows, txtDelimiter = '|', sheetName = 'Export', footerRows = [] }: BuildExportInput
): Promise<BuiltExport> {
  const allRows = [...rows, ...footerRows]

  // ── XLSX (vrai fichier Excel via exceljs) ──────────────────────
  if (format === 'xlsx') {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Coplio'
    wb.created = new Date()
    const ws = wb.addWorksheet(sheetName.slice(0, 31)) // Excel limite à 31 car.
    ws.addRow(header)
    ws.getRow(1).font = { bold: true }
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
    allRows.forEach((r) => ws.addRow(r.map((v) => (v === null ? '' : v))))
    // Largeur auto approximative par colonne
    ws.columns.forEach((col, i) => {
      const maxLen = Math.max(
        header[i]?.length ?? 10,
        ...allRows.map((r) => cell(r[i]).length)
      )
      col.width = Math.min(Math.max(maxLen + 2, 10), 50)
    })
    const buffer = await wb.xlsx.writeBuffer()
    return {
      body: Buffer.from(buffer),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
    }
  }

  // ── TXT (délimité, ex. FEC pipe) ou CSV (point-virgule + BOM) ──
  const delimiter = format === 'csv' ? ';' : txtDelimiter
  const esc = (v: string | number | null): string => {
    const s = cell(v)
    if (format === 'csv') {
      // Échappement CSV standard
      if (/[";\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
      return s
    }
    // TXT : on neutralise le délimiteur et les sauts de ligne
    return s.replace(new RegExp(`\\${delimiter}`, 'g'), ' ').replace(/\r?\n/g, ' ')
  }

  const lines = [header, ...allRows].map((r) => r.map(esc).join(delimiter))
  const content = lines.join('\r\n')

  if (format === 'csv') {
    return { body: '﻿' + content, contentType: 'text/csv; charset=utf-8', extension: 'csv' }
  }
  return { body: content, contentType: 'text/plain; charset=utf-8', extension: 'txt' }
}

/** Réponse HTTP de téléchargement prête à l'emploi. */
export function exportResponse(built: BuiltExport, filenameBase: string): Response {
  const filename = `${filenameBase}.${built.extension}`
  return new Response(built.body as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': built.contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
