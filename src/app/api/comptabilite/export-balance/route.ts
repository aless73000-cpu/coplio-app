import { requireCabinetUser } from '@/lib/api-handler'
import { NextRequest, NextResponse } from 'next/server'
import { buildExport, exportResponse, parseFormat } from '@/lib/export-format'

/**
 * Export Balance des comptes — CSV / XLSX / TXT (au choix)
 * Colonnes: Compte, Libellé, Classe, Total Débit, Total Crédit, Solde D, Solde C
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const coproprieteId = searchParams.get('copropriete')
  const exerciceId    = searchParams.get('exercice')
  const format = parseFormat(searchParams.get('format'), 'csv')

  if (!coproprieteId || !exerciceId) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const auth = await requireCabinetUser()
  if (auth instanceof NextResponse) return auth
  const { supabase, cabinetId } = auth

  // Isolation cabinet
  const { data: copropCheck } = await supabase.from('coproprietes').select('id').eq('id', coproprieteId).eq('cabinet_id', cabinetId).single()
  if (!copropCheck) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { data: balance } = await supabase
    .from('v_balance_comptes')
    .select('*')
    .eq('copropriete_id', coproprieteId)
    .eq('exercice_id', exerciceId)
    .order('compte_numero')

  if (!balance || balance.length === 0) {
    return NextResponse.json({ error: 'Aucune donnée pour cet exercice' }, { status: 404 })
  }

  const formatMontant = (n: number | null): string => {
    if (!n || n === 0) return '0,00'
    return n.toFixed(2).replace('.', ',')
  }

  const header = ['Compte', 'Libellé', 'Classe', 'Total Débit', 'Total Crédit', 'Solde Débiteur', 'Solde Créditeur']

  const rows = balance.map(row => {
    const solde = (row.total_debit ?? 0) - (row.total_credit ?? 0)
    return [
      row.compte_numero,
      row.compte_libelle,
      row.classe,
      formatMontant(row.total_debit),
      formatMontant(row.total_credit),
      solde > 0  ? formatMontant(solde)  : '0,00',
      solde < 0  ? formatMontant(-solde) : '0,00',
    ]
  })

  // Ligne totaux
  const totalDebit  = balance.reduce((s, r) => s + (r.total_debit  ?? 0), 0)
  const totalCredit = balance.reduce((s, r) => s + (r.total_credit ?? 0), 0)
  const totalSolde  = totalDebit - totalCredit
  const totauxRow = [
    'TOTAL', '', '',
    formatMontant(totalDebit),
    formatMontant(totalCredit),
    totalSolde > 0  ? formatMontant(totalSolde)  : '0,00',
    totalSolde < 0  ? formatMontant(-totalSolde) : '0,00',
  ]

  const built = await buildExport(format, { header, rows, footerRows: [totauxRow], sheetName: 'Balance' })
  return exportResponse(built, `Balance_${exerciceId.slice(0, 8)}`)
}
