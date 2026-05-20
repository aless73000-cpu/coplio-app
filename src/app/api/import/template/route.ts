import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { captureException } from '@/lib/monitoring'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const ip = getIP(request)
  const limit = rateLimit(`template:${ip}`, { max: 30, windowMs: 60 * 60 * 1000 })
  if (!limit.success) return rateLimitResponse(limit.resetAt)

  try {
    const wb = new ExcelJS.Workbook()

    // ─── Feuille Lots ────────────────────────────────────────────
    const lotsSheet = wb.addWorksheet('Lots')
    lotsSheet.columns = [
      { header: 'numero',     key: 'numero',     width: 10 },
      { header: 'type',       key: 'type',       width: 20 },
      { header: 'etage',      key: 'etage',      width: 10 },
      { header: 'surface_m2', key: 'surface_m2', width: 12 },
      { header: 'tantiemes',  key: 'tantiemes',  width: 12 },
    ]
    lotsSheet.getRow(1).eachCell((cell) => { cell.font = { bold: true } })
    lotsSheet.addRows([
      { numero: 'A01', type: 'appartement', etage: 'RDC', surface_m2: 45, tantiemes: 250 },
      { numero: 'A02', type: 'appartement', etage: '1er', surface_m2: 60, tantiemes: 320 },
      { numero: 'P01', type: 'parking',     etage: '',    surface_m2: '',  tantiemes: 50  },
    ])

    // ─── Feuille Copropriétaires ─────────────────────────────────
    const coprosSheet = wb.addWorksheet('Copropriétaires')
    coprosSheet.columns = [
      { header: 'prenom',    key: 'prenom',    width: 15 },
      { header: 'nom',       key: 'nom',       width: 15 },
      { header: 'email',     key: 'email',     width: 30 },
      { header: 'telephone', key: 'telephone', width: 14 },
      { header: 'adresse',   key: 'adresse',   width: 35 },
      { header: 'lots',      key: 'lots',      width: 15 },
    ]
    coprosSheet.getRow(1).eachCell((cell) => { cell.font = { bold: true } })
    coprosSheet.addRows([
      { prenom: 'Jean',  nom: 'Dupont', email: 'jean.dupont@email.com',   telephone: '0612345678', adresse: '12 rue de la Paix, 75001 Paris', lots: 'A01'     },
      { prenom: 'Marie', nom: 'Martin', email: 'marie.martin@email.com',  telephone: '0698765432', adresse: '',                               lots: 'A02 P01' },
    ])

    const buffer = await wb.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template_coplio.xlsx"',
      },
    })
  } catch (err) {
    captureException(err, { context: 'import-template' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
