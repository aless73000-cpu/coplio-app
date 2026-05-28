import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Export Balance des comptes en CSV
 * Colonnes: Compte, Libellé, Classe, Total Débit, Total Crédit, Solde D, Solde C
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const coproprieteId = searchParams.get('copropriete')
  const exerciceId    = searchParams.get('exercice')

  if (!coproprieteId || !exerciceId) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Isolation cabinet
  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const { data: copropCheck } = await supabase.from('coproprietes').select('id').eq('id', coproprieteId).eq('cabinet_id', profile.cabinet_id).single()
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

  const escape = (s: string | null | number): string => {
    if (s === null || s === undefined) return ''
    const str = String(s)
    // Échapper pour CSV: si contient virgule/guillemet/newline, encapsuler
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const header = 'Compte;Libellé;Classe;Total Débit;Total Crédit;Solde Débiteur;Solde Créditeur'

  const rows = balance.map(row => {
    const solde = (row.total_debit ?? 0) - (row.total_credit ?? 0)
    return [
      escape(row.compte_numero),
      escape(row.compte_libelle),
      escape(row.classe),
      formatMontant(row.total_debit),
      formatMontant(row.total_credit),
      solde > 0  ? formatMontant(solde)  : '0,00',
      solde < 0  ? formatMontant(-solde) : '0,00',
    ].join(';')
  })

  // Ligne totaux
  const totalDebit  = balance.reduce((s, r) => s + (r.total_debit  ?? 0), 0)
  const totalCredit = balance.reduce((s, r) => s + (r.total_credit ?? 0), 0)
  const totalSolde  = totalDebit - totalCredit
  const totauxRow = [
    'TOTAL',
    '',
    '',
    formatMontant(totalDebit),
    formatMontant(totalCredit),
    totalSolde > 0  ? formatMontant(totalSolde)  : '0,00',
    totalSolde < 0  ? formatMontant(-totalSolde) : '0,00',
  ].join(';')

  const content = [header, ...rows, totauxRow].join('\r\n')

  // BOM UTF-8 pour Excel
  const bom = '﻿'

  return new NextResponse(bom + content, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="Balance_${exerciceId.slice(0, 8)}.csv"`,
    },
  })
}
