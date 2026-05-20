import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { captureException } from '@/lib/monitoring'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = getIP(request)
  const limit = rateLimit(`import-copros:${ip}`, { max: 10, windowMs: 60 * 60 * 1000 })
  if (!limit.success) return rateLimitResponse(limit.resetAt)

  try {
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
        prenom: string
        nom: string
        email?: string
        telephone?: string
        lot_numero?: string
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

    // Load existing lots for this copropriete (to link by numero)
    const { data: lots } = await supabase
      .from('lots')
      .select('id, numero')
      .eq('copropriete_id', copropriete_id)

    const lotMap = new Map(lots?.map((l) => [l.numero.toLowerCase(), l.id]) ?? [])

    const results: { ok: number; errors: { row: number; message: string }[] } = { ok: 0, errors: [] }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2

      if (!row.nom?.trim()) {
        results.errors.push({ row: rowNum, message: 'Nom manquant' })
        continue
      }

      // Check if copropriétaire already exists (by email)
      if (row.email?.trim()) {
        const { data: existing } = await supabase
          .from('coproprietaires')
          .select('id')
          .eq('cabinet_id', profile.cabinet_id)
          .eq('email', row.email.trim().toLowerCase())
          .single()

        if (existing) {
          results.errors.push({ row: rowNum, message: `Email ${row.email} déjà enregistré` })
          continue
        }
      }

      // Insert copropriétaire
      const { data: newCopro, error } = await supabase.from('coproprietaires').insert({
        cabinet_id: profile.cabinet_id,
        prenom: row.prenom?.trim() || '',
        nom: row.nom.trim(),
        email: row.email?.trim().toLowerCase() || null,
        telephone: row.telephone?.trim() || null,
        portail_actif: false,
      }).select('id').single()

      if (error) {
        results.errors.push({ row: rowNum, message: error.message })
        continue
      }

      // Link to lot if lot_numero provided
      // Note: coproprietaire_id column does not exist on lots table
      // lot-coproprietaire linking is handled via profiles.lot_id

      results.ok++
    }

    return NextResponse.json(results)
  } catch (err) {
    captureException(err, { context: 'import-coproprietaires' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
