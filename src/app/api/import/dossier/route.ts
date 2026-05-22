import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { withErrorHandler } from '@/lib/api-handler'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { captureException } from '@/lib/monitoring'

const LOT_TYPES = ['appartement', 'maison', 'local_commercial', 'parking', 'cave', 'autre'] as const
type LotType = typeof LOT_TYPES[number]

function normalizeLotType(raw: string): LotType {
  const s = raw.toLowerCase().trim()
  if (LOT_TYPES.includes(s as LotType)) return s as LotType
  if (s.startsWith('app')) return 'appartement'
  if (s.startsWith('mai')) return 'maison'
  if (s.startsWith('local') || s.startsWith('comm')) return 'local_commercial'
  if (s.startsWith('park') || s.startsWith('garage')) return 'parking'
  if (s.startsWith('cave') || s.startsWith('sous')) return 'cave'
  return 'autre'
}

export const POST = withErrorHandler(async (request: Request) => {
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

    const limit = await rateLimit(`import-dossier:${user.id}`, { max: 10, windowMs: 60_000 })
    if (!limit.success) return rateLimitResponse(limit.resetAt)

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const copropriete_id = formData.get('copropriete_id') as string | null

    if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    if (!copropriete_id) return NextResponse.json({ error: 'Copropriété non sélectionnée' }, { status: 400 })

    // Verify copropriete belongs to this cabinet
    const admin = createAdminClient()
    const { data: copropriete } = await admin
      .from('coproprietes')
      .select('id')
      .eq('id', copropriete_id)
      .eq('cabinet_id', profile.cabinet_id)
      .single()
    if (!copropriete) return NextResponse.json({ error: 'Copropriété introuvable' }, { status: 404 })

    // Parse Excel
    const arrayBuffer = await file.arrayBuffer()
    const wb = XLSX.read(arrayBuffer, { type: 'array' })

    // ─── Parse Lots sheet ─────────────────────────────────────
    const lotsSheet = wb.Sheets['Lots'] || wb.Sheets[wb.SheetNames[0]]
    const rawLots: Record<string, unknown>[] = XLSX.utils.sheet_to_json(lotsSheet, { defval: '' })

    const lotsCreated: { numero: string; id: string }[] = []
    const lotsErrors: string[] = []

    for (const row of rawLots) {
      const numero = String(row['numero'] || row['Numéro'] || row['numero'] || '').trim()
      const type = normalizeLotType(String(row['type'] || row['Type'] || 'autre'))
      const etage = String(row['etage'] || row['Étage'] || '').trim() || undefined
      const surface = parseFloat(String(row['surface_m2'] || row['surface'] || row['Surface'] || '')) || undefined
      const tantiemes = parseInt(String(row['tantiemes'] || row['Tantièmes'] || row['tantièmes'] || '0'), 10)

      if (!numero) continue
      if (!tantiemes || tantiemes < 1) {
        lotsErrors.push(`Lot ${numero}: tantièmes invalides`)
        continue
      }

      const { data: lot, error } = await admin
        .from('lots')
        .insert({
          copropriete_id,
          numero,
          type,
          ...(etage ? { etage } : {}),
          ...(surface ? { surface } : {}),
          tantiemes,
        })
        .select('id, numero')
        .single()

      if (error) {
        lotsErrors.push(`Lot ${numero}: ${error.message}`)
      } else if (lot) {
        lotsCreated.push({ id: lot.id, numero: lot.numero })
      }
    }

    // ─── Parse Copropriétaires sheet ──────────────────────────
    const coprosSheetName = wb.SheetNames.find(
      (n) => n.toLowerCase().includes('copro') || n.toLowerCase().includes('proprio')
    ) || wb.SheetNames[1]

    const coprosCreated: number = await (async () => {
      if (!coprosSheetName) return 0
      const coprosSheet = wb.Sheets[coprosSheetName]
      if (!coprosSheet) return 0

      const rawCopros: Record<string, unknown>[] = XLSX.utils.sheet_to_json(coprosSheet, { defval: '' })
      let count = 0

      for (const row of rawCopros) {
        const prenom = String(row['prenom'] || row['Prénom'] || '').trim()
        const nom = String(row['nom'] || row['Nom'] || '').trim()
        const email = String(row['email'] || row['Email'] || '').trim() || undefined
        const telephone = String(row['telephone'] || row['Téléphone'] || row['telephone'] || '').trim() || undefined
        const adresse = String(row['adresse'] || row['Adresse'] || '').trim() || undefined
        const lotsRaw = String(row['lots'] || row['Lots'] || row['lot_numero'] || '').trim()

        if (!prenom && !nom) continue

        // Insert copropriétaire
        const { data: copro, error: coproError } = await admin
          .from('coproprietaires')
          .insert({
            cabinet_id: profile.cabinet_id!,
            prenom: prenom || '—',
            nom: nom || '—',
            ...(email ? { email } : {}),
            ...(telephone ? { telephone } : {}),
            ...(adresse ? { adresse_correspondance: adresse } : {}),
          })
          .select('id')
          .single()

        if (coproError || !copro) continue
        count++

        // Link to lots
        if (lotsRaw) {
          const lotNumeros = lotsRaw.split(/[\s,;]+/).filter(Boolean)
          for (const lotNum of lotNumeros) {
            const match = lotsCreated.find(
              (l) => l.numero.toLowerCase() === lotNum.toLowerCase()
            )
            if (match) {
              await admin
                .from('coproprietaire_lots')
                .insert({ coproprietaire_id: copro.id, lot_id: match.id })
            }
          }
        }
      }
      return count
    })()

    return NextResponse.json({
      lots_created: lotsCreated.length,
      copros_created: coprosCreated,
      errors: lotsErrors,
    })
  } catch (err) {
    captureException(err, { context: 'import-dossier' })
    return NextResponse.json({ error: 'Erreur lors de l\'import' }, { status: 500 })
  }
})
