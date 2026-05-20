import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function GET() {
  const wb = new ExcelJS.Workbook()

  // ─── Feuille Lots ───────────────────────────────────────────
  const sheet = wb.addWorksheet('Lots')
  sheet.columns = [
    { header: 'numero',       key: 'numero',       width: 10 },
    { header: 'type',         key: 'type',         width: 20 },
    { header: 'etage',        key: 'etage',        width: 10 },
    { header: 'surface_m2',   key: 'surface_m2',   width: 12 },
    { header: 'tantiemes',    key: 'tantiemes',    width: 12 },
    { header: 'batiment',     key: 'batiment',     width: 12 },
    { header: 'commentaires', key: 'commentaires', width: 25 },
  ]

  // Style en-tête
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE1F5EE' } }
  })

  // Données d'exemple
  const rows = [
    { numero: 'A01', type: 'appartement', etage: 'RDC',   surface_m2: 45, tantiemes: 250, batiment: 'A', commentaires: '' },
    { numero: 'A02', type: 'appartement', etage: 'RDC',   surface_m2: 60, tantiemes: 320, batiment: 'A', commentaires: '' },
    { numero: 'B01', type: 'appartement', etage: '1er',   surface_m2: 55, tantiemes: 280, batiment: 'A', commentaires: '' },
    { numero: 'B02', type: 'appartement', etage: '1er',   surface_m2: 70, tantiemes: 380, batiment: 'A', commentaires: '' },
    { numero: 'P01', type: 'parking',     etage: '',      surface_m2: '',  tantiemes: 50,  batiment: '',  commentaires: 'Cave 1' },
    { numero: 'P02', type: 'parking',     etage: '',      surface_m2: '',  tantiemes: 50,  batiment: '',  commentaires: 'Cave 2' },
  ]
  sheet.addRows(rows)

  // ─── Feuille Instructions ────────────────────────────────────
  const info = wb.addWorksheet('Instructions')
  info.columns = [
    { header: 'Colonne',          key: 'col',      width: 15 },
    { header: 'Obligatoire',      key: 'req',      width: 12 },
    { header: 'Valeurs acceptées', key: 'values',  width: 55 },
    { header: 'Exemple',          key: 'example',  width: 20 },
  ]
  info.getRow(1).eachCell((cell) => { cell.font = { bold: true } })
  info.addRows([
    { col: 'numero',       req: 'OUI', values: 'Texte libre',                                                         example: 'A01, B02, P01' },
    { col: 'type',         req: 'OUI', values: 'appartement / maison / local_commercial / parking / cave / autre',    example: 'appartement' },
    { col: 'etage',        req: 'non', values: 'Texte libre',                                                         example: 'RDC, 1er, 2ème' },
    { col: 'surface_m2',   req: 'non', values: 'Nombre décimal',                                                      example: '45.5' },
    { col: 'tantiemes',    req: 'OUI', values: 'Nombre entier ≥ 1',                                                   example: '250' },
    { col: 'batiment',     req: 'non', values: 'Texte libre',                                                         example: 'A, Bâtiment Nord' },
    { col: 'commentaires', req: 'non', values: 'Texte libre',                                                         example: 'Cave côté jardin' },
  ])

  const buffer = await wb.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_lots_coplio.xlsx"',
    },
  })
}
