import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { withErrorHandler, requireCabinetUser } from '@/lib/api-handler'

// Format FEC (Fichier des Écritures Comptables) — norme DGFiP
// Séparateur : | (pipe), encodage UTF-8, dates YYYYMMDD

export const GET = withErrorHandler(async (request: Request) => {
  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { cabinetId } = auth

  const limit = await rateLimit(`export-fec:${cabinetId}`, { max: 30, windowMs: 60 * 60 * 1000 })
  if (!limit.success) return rateLimitResponse(limit.resetAt)

  const { searchParams } = new URL(request.url)
  const annee = searchParams.get('annee') ?? new Date().getFullYear().toString()
  const coproprieteId = searchParams.get('copropriete_id')

  const admin = createAdminClient()

  // Isolation tenant : on ne traite QUE les copropriétés du cabinet de l'utilisateur.
  // Si copropriete_id est fourni, il doit appartenir à ce cabinet (sinon → vide).
  let coproQuery = admin.from('coproprietes').select('id').eq('cabinet_id', cabinetId)
  if (coproprieteId) coproQuery = coproQuery.eq('id', coproprieteId)
  const { data: copros } = await coproQuery
  const coproIds = (copros ?? []).map(c => c.id)

  const { data: lots } = coproIds.length > 0
    ? await admin.from('lots').select('id').in('copropriete_id', coproIds)
    : { data: [] as { id: string }[] }
  const lotIds = (lots ?? []).map(l => l.id)

  // Récupérer les appels de charges, strictement limités aux lots du cabinet
  const { data: appels } = lotIds.length > 0
    ? await admin
        .from('appels_charges')
        .select('id, montant, montant_paye, date_echeance, date_paiement, paye, lot:lots(id, numero, copropriete:coproprietes(id, nom))')
        .gte('date_echeance', `${annee}-01-01`)
        .lte('date_echeance', `${annee}-12-31`)
        .in('lot_id', lotIds)
    : { data: [] as never[] }

  const header = 'JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise'

  const rows: string[] = [header]
  let ecritureNum = 1

  for (const appel of appels ?? []) {
    const lot = appel.lot as unknown as { id: string; numero: string; copropriete: { id: string; nom: string } } | null
    const dateEcheance = appel.date_echeance.replace(/-/g, '').slice(0, 8)
    // Bug #6 fix : utiliser date_paiement (date réelle) pour les écritures de règlement, pas date_echeance
    const datePaiementRaw = (appel as { date_paiement?: string }).date_paiement
    const datePaiement = datePaiementRaw
      ? datePaiementRaw.replace(/-/g, '').slice(0, 8)
      : dateEcheance // fallback si non renseigné
    const copropNom = lot?.copropriete?.nom?.substring(0, 20) ?? 'COPROPRIETE'
    const lotNum = lot?.numero ?? '?'
    // BIZ-02 : la norme FEC exige des codes compte numériques (411XXXXXX).
    // On extrait uniquement les chiffres du numéro de lot pour le code 411.
    const lotNumDigits = lotNum.replace(/\D/g, '').padStart(6, '0') || '000000'
    const ecrLib = `APPEL CHARGES LOT ${lotNum}`.substring(0, 32)
    const montant = (appel.montant as number).toFixed(2)
    const montantPaye = (appel.montant_paye as number ?? 0).toFixed(2)

    // Ligne débit : compte copropriétaire (411)
    rows.push([
      'VE', 'VENTES', String(ecritureNum).padStart(6, '0'), dateEcheance,
      `411${lotNumDigits}`, `COPRO ${lotNum}`, '', '',
      `AC${String(ecritureNum).padStart(6, '0')}`, dateEcheance,
      ecrLib, montant, '0.00', '', '', '', montant, 'EUR'
    ].join('|'))

    // Ligne crédit : compte charges (706)
    rows.push([
      'VE', 'VENTES', String(ecritureNum).padStart(6, '0'), dateEcheance,
      '706000', `CHARGES ${copropNom}`, '', '',
      `AC${String(ecritureNum).padStart(6, '0')}`, dateEcheance,
      ecrLib, '0.00', montant, '', '', '', montant, 'EUR'
    ].join('|'))

    ecritureNum++

    // Si paiement partiel ou total
    if ((appel.montant_paye as number) > 0) {
      rows.push([
        'BQ', 'BANQUE', String(ecritureNum).padStart(6, '0'), datePaiement,
        '512000', 'BANQUE', '', '',
        `PAY${String(ecritureNum).padStart(6, '0')}`, datePaiement,
        `PAIEMENT LOT ${lotNum}`, montantPaye, '0.00', '', '', '', montantPaye, 'EUR'
      ].join('|'))
      rows.push([
        'BQ', 'BANQUE', String(ecritureNum).padStart(6, '0'), datePaiement,
        `411${lotNumDigits}`, `COPRO ${lotNum}`, '', '',
        `PAY${String(ecritureNum).padStart(6, '0')}`, datePaiement,
        `PAIEMENT LOT ${lotNum}`, '0.00', montantPaye, '', '', '', montantPaye, 'EUR'
      ].join('|'))
      ecritureNum++
    }
  }

  const content = rows.join('\n')
  const filename = `FEC_COPLIO_${annee}${coproprieteId ? `_${coproprieteId.slice(0, 8)}` : ''}.txt`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
})
