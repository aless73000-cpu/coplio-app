import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const coproprieteId  = searchParams.get('copropriete')
  const exerciceId     = searchParams.get('exercice')
  const compteNumero   = searchParams.get('compte_numero') ?? ''

  if (!coproprieteId || !exerciceId) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  let query = supabase
    .from('v_grand_livre')
    .select('*')
    .eq('copropriete_id', coproprieteId)
    .eq('exercice_id', exerciceId)
    .order('date_ecriture', { ascending: true })
    .order('ordre', { ascending: true })

  if (compteNumero) query = query.eq('compte_numero', compteNumero)

  const { data: lignes } = await query

  if (!lignes || lignes.length === 0) {
    return NextResponse.json({ error: 'Aucune donnée' }, { status: 404 })
  }

  const escape = (s: string | null | number): string => {
    if (s === null || s === undefined) return ''
    const str = String(s)
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const fmt = (n: number | null): string => {
    if (!n || n === 0) return '0,00'
    return n.toFixed(2).replace('.', ',')
  }

  const header = 'Date;Journal;N° Pièce;Libellé;Compte;Libellé compte;Débit;Crédit;Solde progressif'

  let solde = 0
  const rows = lignes.map(l => {
    solde += (l.debit ?? 0) - (l.credit ?? 0)
    return [
      escape(l.date_ecriture),
      escape(l.journal_code),
      escape(l.numero_piece),
      escape(l.libelle_ligne ?? l.libelle_ecriture),
      escape(l.compte_numero),
      escape(l.compte_libelle),
      fmt(l.debit),
      fmt(l.credit),
      `${fmt(Math.abs(solde))} ${solde >= 0 ? 'D' : 'C'}`,
    ].join(';')
  })

  const bom = '﻿'
  const content = bom + [header, ...rows].join('\r\n')

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="GrandLivre_${compteNumero || 'all'}.csv"`,
    },
  })
}
