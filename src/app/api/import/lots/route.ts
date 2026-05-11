import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('cabinet_id, role').eq('id', user.id).single()
  if (!profile?.cabinet_id || !['owner', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const body = await request.json()
  const { rows, copropriete_id } = body as {
    rows: {
      numero: string
      type: string
      etage?: string
      surface?: string
      tantiemes: string
    }[]
    copropriete_id: string
  }

  if (!rows?.length || !copropriete_id) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  // Verify copropriete belongs to cabinet
  const { data: copro } = await supabase
    .from('coproprietes')
    .select('id')
    .eq('id', copropriete_id)
    .eq('cabinet_id', profile.cabinet_id)
    .single()

  if (!copro) return NextResponse.json({ error: 'Copropriété introuvable' }, { status: 404 })

  const validTypes = ['appartement', 'maison', 'local_commercial', 'parking', 'cave', 'autre']
  const results: { ok: number; errors: { row: number; message: string }[] } = { ok: 0, errors: [] }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // header is row 1

    if (!row.numero?.trim()) {
      results.errors.push({ row: rowNum, message: 'Numéro de lot manquant' })
      continue
    }

    const tantiemes = parseFloat(row.tantiemes)
    if (isNaN(tantiemes) || tantiemes <= 0) {
      results.errors.push({ row: rowNum, message: `Tantièmes invalides pour le lot ${row.numero}` })
      continue
    }

    const type = validTypes.includes(row.type?.toLowerCase()) ? row.type.toLowerCase() : 'appartement'
    const surface = row.surface ? parseFloat(row.surface) : undefined

    const { error } = await supabase.from('lots').insert({
      copropriete_id,
      numero: row.numero.trim(),
      type,
      etage: row.etage?.trim() || null,
      surface: surface && !isNaN(surface) ? surface : null,
      tantiemes,
      solde_compte: 0,
      montant_impaye: 0,
      occupe: false,
    })

    if (error) {
      if (error.code === '23505') {
        results.errors.push({ row: rowNum, message: `Lot ${row.numero} existe déjà` })
      } else {
        results.errors.push({ row: rowNum, message: error.message })
      }
    } else {
      results.ok++
    }
  }

  return NextResponse.json(results)
}
