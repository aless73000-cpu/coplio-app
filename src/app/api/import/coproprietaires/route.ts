import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { captureException } from '@/lib/monitoring'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = getIP(request)
  const limit = await rateLimit(`import-copros:${ip}`, { max: 10, windowMs: 60 * 60 * 1000 })
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

    // Pré-charger tous les emails existants en une seule requête (évite N+1)
    const emailsToCheck = rows
      .map(r => r.email?.trim().toLowerCase())
      .filter((e): e is string => Boolean(e))
    const { data: existingCopros } = emailsToCheck.length > 0
      ? await supabase
          .from('coproprietaires')
          .select('email')
          .eq('cabinet_id', profile.cabinet_id)
          .in('email', emailsToCheck)
      : { data: [] }
    const existingEmails = new Set(existingCopros?.map(c => c.email) ?? [])

    const results: { ok: number; errors: { row: number; message: string }[] } = { ok: 0, errors: [] }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2

      if (!row.nom?.trim()) {
        results.errors.push({ row: rowNum, message: 'Nom manquant' })
        continue
      }

      // Check doublons email via le Set pré-chargé (O(1), 0 requête)
      if (row.email?.trim()) {
        if (existingEmails.has(row.email.trim().toLowerCase())) {
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

      // Lier au lot si lot_numero fourni
      if (row.lot_numero?.trim()) {
        const lotId = lotMap.get(row.lot_numero.trim().toLowerCase())
        if (lotId) {
          await supabase.from('coproprietaire_lots').insert({
            coproprietaire_id: newCopro.id,
            lot_id: lotId,
          })
        } else {
          results.errors.push({ row: rowNum, message: `Lot "${row.lot_numero}" introuvable dans cette copropriété (copropriétaire créé sans lot)` })
        }
      }

      results.ok++
    }

    return NextResponse.json(results)
  } catch (err) {
    captureException(err, { context: 'import-coproprietaires' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
