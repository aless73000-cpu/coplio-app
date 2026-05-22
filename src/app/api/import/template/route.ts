import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { withErrorHandler } from '@/lib/api-handler'

export const GET = withErrorHandler(async () => {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Lots
  const lotsData = [
    ['numero', 'type', 'etage', 'surface_m2', 'tantiemes'],
    ['A01', 'appartement', 'RDC', 45, 250],
    ['A02', 'appartement', '1er', 60, 320],
    ['P01', 'parking', '', '', 50],
  ]
  const lotsSheet = XLSX.utils.aoa_to_sheet(lotsData)
  lotsSheet['!cols'] = [
    { wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(wb, lotsSheet, 'Lots')

  // Sheet 2: Copropriétaires
  const coprosData = [
    ['prenom', 'nom', 'email', 'telephone', 'adresse', 'lots'],
    ['Jean', 'Dupont', 'jean.dupont@email.com', '0612345678', '12 rue de la Paix, 75001 Paris', 'A01'],
    ['Marie', 'Martin', 'marie.martin@email.com', '0698765432', '', 'A02 P01'],
  ]
  const coprosSheet = XLSX.utils.aoa_to_sheet(coprosData)
  coprosSheet['!cols'] = [
    { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 14 }, { wch: 35 }, { wch: 15 },
  ]
  XLSX.utils.book_append_sheet(wb, coprosSheet, 'Copropriétaires')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_coplio.xlsx"',
    },
  })
})
