import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Export FEC (Fichier des Écritures Comptables)
 * Format: arrêté du 29 juillet 2013 - DGFiP
 * Séparateur: | (pipe)
 * Encodage: UTF-8
 *
 * Colonnes obligatoires (18 champs):
 * JournalCode | JournalLib | EcritureNum | EcritureDate | CompteNum | CompteLib |
 * CompAuxNum | CompAuxLib | PieceRef | PieceDate | EcritureLib |
 * Debit | Credit | EcritureLet | DateLet | ValidDate | Montantdevise | Idevise
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

  // Vérifier accès + isolation cabinet
  const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { data: coprop } = await supabase
    .from('coproprietes')
    .select('nom')
    .eq('id', coproprieteId)
    .eq('cabinet_id', profile.cabinet_id)
    .single()

  if (!coprop) return NextResponse.json({ error: 'Copropriété introuvable' }, { status: 404 })

  // Récupérer les lignes du grand livre
  const { data: lignes } = await supabase
    .from('v_grand_livre')
    .select('*')
    .eq('copropriete_id', coproprieteId)
    .eq('exercice_id', exerciceId)
    .order('date_ecriture', { ascending: true })
    .order('ordre', { ascending: true })

  if (!lignes || lignes.length === 0) {
    return NextResponse.json({ error: 'Aucune écriture pour cet exercice' }, { status: 404 })
  }

  // En-tête FEC
  const header = [
    'JournalCode',
    'JournalLib',
    'EcritureNum',
    'EcritureDate',
    'CompteNum',
    'CompteLib',
    'CompAuxNum',
    'CompAuxLib',
    'PieceRef',
    'PieceDate',
    'EcritureLib',
    'Debit',
    'Credit',
    'EcritureLet',
    'DateLet',
    'ValidDate',
    'Montantdevise',
    'Idevise',
  ].join('|')

  // Formater chaque ligne
  const formatDate = (d: string | null): string => {
    if (!d) return ''
    return d.replace(/-/g, '')  // YYYYMMDD
  }

  const formatMontant = (n: number | null): string => {
    if (!n || n === 0) return '0,00'
    return n.toFixed(2).replace('.', ',')
  }

  const escape = (s: string | null): string => {
    if (!s) return ''
    return s.replace(/\|/g, ' ').replace(/\r?\n/g, ' ')
  }

  let ecritureNum = 1
  let currentEcritureId = ''

  const rows = lignes.map((l) => {
    // Incrémenter le numéro d'écriture quand on change d'écriture
    if (l.ecriture_id !== currentEcritureId) {
      if (currentEcritureId !== '') ecritureNum++
      currentEcritureId = l.ecriture_id ?? ''
    }

    return [
      escape(l.journal_code),                    // JournalCode
      escape(l.journal_libelle ?? ''),           // JournalLib
      String(ecritureNum).padStart(6, '0'),      // EcritureNum
      formatDate(l.date_ecriture),               // EcritureDate
      escape(l.compte_numero),                   // CompteNum
      escape(l.compte_libelle),                  // CompteLib
      '',                                        // CompAuxNum (compte auxiliaire)
      '',                                        // CompAuxLib
      escape(l.numero_piece ?? ''),              // PieceRef
      formatDate(l.date_ecriture),               // PieceDate
      escape(l.libelle_ligne ?? l.libelle_ecriture ?? ''), // EcritureLib
      formatMontant(l.debit),                    // Debit
      formatMontant(l.credit),                   // Credit
      '',                                        // EcritureLet (lettrage)
      '',                                        // DateLet
      formatDate(l.date_ecriture),               // ValidDate
      '',                                        // Montantdevise
      '',                                        // Idevise
    ].join('|')
  })

  const content = [header, ...rows].join('\r\n')

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="FEC_${coproprieteId.slice(0, 8)}_${exerciceId.slice(0, 8)}.txt"`,
    },
  })
}
