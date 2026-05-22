import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { withErrorHandler } from '@/lib/api-handler'

export const GET = withErrorHandler(async () => {
  const wb = XLSX.utils.book_new()

  const lotsData = [
    ['numero', 'type', 'etage', 'surface_m2', 'tantiemes', 'batiment', 'commentaires'],
    ['A01', 'appartement', 'RDC', 45, 250, 'A', ''],
    ['A02', 'appartement', 'RDC', 60, 320, 'A', ''],
    ['B01', 'appartement', '1er', 55, 280, 'A', ''],
    ['B02', 'appartement', '1er', 70, 380, 'A', ''],
    ['P01', 'parking', '', '', 50, '', 'Cave 1'],
    ['P02', 'parking', '', '', 50, '', 'Cave 2'],
  ]

  const sheet = XLSX.utils.aoa_to_sheet(lotsData)
  sheet['!cols'] = [
    { wch: 10 }, { wch: 20 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 25 },
  ]
  XLSX.utils.book_append_sheet(wb, sheet, 'Lots')

  // Info sheet
  const infoData = [
    ['Colonne', 'Obligatoire', 'Valeurs acceptées', 'Exemple'],
    ['numero', 'OUI', 'Texte libre', 'A01, B02, P01'],
    ['type', 'OUI', 'appartement / maison / local_commercial / parking / cave / autre', 'appartement'],
    ['etage', 'non', 'Texte libre', 'RDC, 1er, 2ème'],
    ['surface_m2', 'non', 'Nombre décimal', '45.5'],
    ['tantiemes', 'OUI', 'Nombre entier ≥ 1', '250'],
    ['batiment', 'non', 'Texte libre', 'A, Bâtiment Nord'],
    ['commentaires', 'non', 'Texte libre', 'Cave côté jardin'],
  ]
  const infoSheet = XLSX.utils.aoa_to_sheet(infoData)
  infoSheet['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 55 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, infoSheet, 'Instructions')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_lots_coplio.xlsx"',
    },
  })
})
