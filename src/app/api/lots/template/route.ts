import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { withErrorHandler } from '@/lib/api-handler'

export const GET = withErrorHandler(async () => {
  // Auth : accès réservé aux utilisateurs connectés
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const wb = new ExcelJS.Workbook()

  // ── Feuille Lots ──────────────────────────────────────────
  const lotsSheet = wb.addWorksheet('Lots')
  lotsSheet.columns = [
    { header: 'numero',       key: 'numero',       width: 10 },
    { header: 'type',         key: 'type',         width: 20 },
    { header: 'etage',        key: 'etage',        width: 10 },
    { header: 'surface_m2',   key: 'surface_m2',   width: 12 },
    { header: 'tantiemes',    key: 'tantiemes',     width: 12 },
    { header: 'batiment',     key: 'batiment',     width: 12 },
    { header: 'commentaires', key: 'commentaires', width: 25 },
  ]
  lotsSheet.addRows([
    { numero: 'A01', type: 'appartement', etage: 'RDC', surface_m2: 45,  tantiemes: 250, batiment: 'A', commentaires: '' },
    { numero: 'A02', type: 'appartement', etage: 'RDC', surface_m2: 60,  tantiemes: 320, batiment: 'A', commentaires: '' },
    { numero: 'B01', type: 'appartement', etage: '1er', surface_m2: 55,  tantiemes: 280, batiment: 'A', commentaires: '' },
    { numero: 'B02', type: 'appartement', etage: '1er', surface_m2: 70,  tantiemes: 380, batiment: 'A', commentaires: '' },
    { numero: 'P01', type: 'parking',     etage: '',    surface_m2: null, tantiemes: 50,  batiment: '',  commentaires: 'Cave 1' },
    { numero: 'P02', type: 'parking',     etage: '',    surface_m2: null, tantiemes: 50,  batiment: '',  commentaires: 'Cave 2' },
  ])

  // ── Feuille Instructions ─────────────────────────────────
  const infoSheet = wb.addWorksheet('Instructions')
  infoSheet.columns = [
    { header: 'Colonne',          key: 'col',      width: 15 },
    { header: 'Obligatoire',      key: 'required', width: 12 },
    { header: 'Valeurs acceptées', key: 'values',  width: 55 },
    { header: 'Exemple',          key: 'example',  width: 20 },
  ]
  infoSheet.addRows([
    { col: 'numero',       required: 'OUI', values: 'Texte libre',                                                          example: 'A01, B02, P01' },
    { col: 'type',         required: 'OUI', values: 'appartement / maison / local_commercial / parking / cave / autre',     example: 'appartement' },
    { col: 'etage',        required: 'non', values: 'Texte libre',                                                          example: 'RDC, 1er, 2ème' },
    { col: 'surface_m2',   required: 'non', values: 'Nombre décimal',                                                       example: '45.5' },
    { col: 'tantiemes',    required: 'OUI', values: 'Nombre entier ≥ 1',                                                    example: '250' },
    { col: 'batiment',     required: 'non', values: 'Texte libre',                                                          example: 'A, Bâtiment Nord' },
    { col: 'commentaires', required: 'non', values: 'Texte libre',                                                          example: 'Cave côté jardin' },
  ])

  const buffer = await wb.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_lots_coplio.xlsx"',
    },
  })
})
