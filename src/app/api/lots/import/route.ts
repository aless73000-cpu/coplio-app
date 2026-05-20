import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { checkQuota, quotaExceededResponse } from '@/lib/plan-guard'
import { captureException } from '@/lib/monitoring'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/rate-limit'

const LOT_TYPES = ['appartement', 'maison', 'local_commercial', 'parking', 'cave', 'autre'] as const
type LotType = typeof LOT_TYPES[number]

function normalizeLotType(raw: string): LotType {
  const s = (raw ?? '').toLowerCase().trim()
  if (LOT_TYPES.includes(s as LotType)) return s as LotType
  if (s.startsWith('app')) return 'appartement'
  if (s.startsWith('mai')) return 'maison'
  if (s.startsWith('local') || s.startsWith('comm')) return 'local_commercial'
  if (s.startsWith('park') || s.startsWith('garage')) return 'parking'
  if (s.startsWith('cave') || s.startsWith('sous')) return 'cave'
  return 'autre'
}

export async function POST(request: Request) {
  const ip = getIP(request)
  const limit = rateLimit(`import:${ip}`, { max: 10, windowMs: 60 * 60 * 1000 })
  if (!limit.success) return rateLimitResponse(limit.resetAt)

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id')
      .eq('id', user.id)
      .single()
    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 400 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const copropriete_id = formData.get('copropriete_id') as string | null

    if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    if (!copropriete_id) return NextResponse.json({ error: 'Copropriété manquante' }, { status: 400 })

    const admin = createAdminClient()

    // Verify copropriete belongs to this cabinet
    const { data: copropriete } = await admin
      .from('coproprietes')
      .select('id')
      .eq('id', copropriete_id)
      .eq('cabinet_id', profile.cabinet_id)
      .single()
    if (!copropriete) return NextResponse.json({ error: 'Copropriété introuvable' }, { status: 404 })

    // Vérification quota (on parse d'abord pour compter les lignes valides)
    const quota = await checkQuota(profile.cabinet_id, 'lots', 1)
    if (!quota.allowed) return quotaExceededResponse(quota)

    // Fetch existing lot numbers to detect duplicates
    const { data: existingLots } = await admin
      .from('lots')
      .select('numero')
      .eq('copropriete_id', copropriete_id)
    const existingNumeros = new Set((existingLots ?? []).map((l: { numero: string }) => l.numero.toLowerCase()))

    // Parse Excel
    const arrayBuffer = await file.arrayBuffer()
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(arrayBuffer)
    const sheet = wb.getWorksheet('Lots') ?? wb.worksheets[0]
    if (!sheet) return NextResponse.json({ error: 'Aucune feuille trouvée dans le fichier.' }, { status: 400 })

    // Extraire les en-têtes depuis la 1ère ligne
    const headerRow = sheet.getRow(1).values as (string | undefined)[]
    const headers = headerRow.slice(1) // ExcelJS commence à l'index 1

    const rows: Record<string, unknown>[] = []
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // skip header
      const values = row.values as unknown[]
      const obj: Record<string, unknown> = {}
      headers.forEach((h, i) => {
        if (h) obj[h] = values[i + 1] ?? ''
      })
      rows.push(obj)
    })

    const toInsert: {
      copropriete_id: string
      numero: string
      type: LotType
      etage?: string
      surface?: number
      tantiemes: number
    }[] = []
    const errors: string[] = []
    const skipped: string[] = []

    for (const row of rows) {
      const numero = String(row['numero'] || row['Numéro'] || row['NUMERO'] || '').trim()
      if (!numero) continue

      // Duplicate check
      if (existingNumeros.has(numero.toLowerCase())) {
        skipped.push(numero)
        continue
      }

      const type = normalizeLotType(String(row['type'] || row['Type'] || 'appartement'))
      const etage = String(row['etage'] || row['Étage'] || row['ETAGE'] || '').trim() || undefined
      const surfaceRaw = parseFloat(String(row['surface_m2'] || row['surface'] || row['Surface'] || ''))
      const surface = isNaN(surfaceRaw) ? undefined : surfaceRaw
      const tantiemes = parseInt(String(row['tantiemes'] || row['Tantièmes'] || row['TANTIEMES'] || '0'), 10)

      if (!tantiemes || tantiemes < 1) {
        errors.push(`Lot ${numero} ignoré : tantièmes manquants ou invalides (valeur : ${row['tantiemes'] ?? ''})`)
        continue
      }

      toInsert.push({
        copropriete_id,
        numero,
        type,
        ...(etage ? { etage } : {}),
        ...(surface !== undefined ? { surface } : {}),
        tantiemes,
      })
    }

    if (toInsert.length === 0 && errors.length === 0 && skipped.length === 0) {
      return NextResponse.json({ error: 'Aucune ligne valide trouvée dans le fichier.' }, { status: 400 })
    }

    let lotsCreated = 0
    if (toInsert.length > 0) {
      const { data: inserted, error: insertError } = await admin
        .from('lots')
        .insert(toInsert)
        .select('id')
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
      lotsCreated = inserted?.length ?? 0
    }

    if (skipped.length > 0) {
      errors.push(`${skipped.length} lot(s) ignoré(s) car déjà existants : ${skipped.join(', ')}`)
    }

    return NextResponse.json({ lots_created: lotsCreated, errors })
  } catch (err) {
    captureException(err, { context: 'lots-import' })
    return NextResponse.json({ error: "Erreur lors de l'import" }, { status: 500 })
  }
}
