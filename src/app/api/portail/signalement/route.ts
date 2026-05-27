import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'
import { rateLimit, getIP, rateLimitResponse } from '@/lib/rate-limit'
import { captureException } from '@/lib/monitoring'

export const POST = withErrorHandler(async (request: Request) => {
  const ip = getIP(request)
  const limit = await rateLimit(`signalement:${ip}`, { max: 5, windowMs: 60 * 60 * 1000 })
  if (!limit.success) return rateLimitResponse(limit.resetAt)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, lot_id, prenom, nom, lot:lots(id, numero, copropriete:coproprietes(id, nom, cabinet_id))')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner_resident') {
    return NextResponse.json({ error: 'Accès réservé aux copropriétaires' }, { status: 403 })
  }

  const lot = profile?.lot as {
    id: string
    numero: string
    copropriete: { id: string; nom: string; cabinet_id: string }
  } | null

  if (!lot?.copropriete?.cabinet_id) {
    return NextResponse.json({ error: 'Aucun logement associé à votre compte' }, { status: 400 })
  }

  const formData = await request.formData()
  const zone        = (formData.get('zone') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const urgence     = (formData.get('urgence') as string) || 'normal'
  const file        = formData.get('photo') as File | null

  if (!description || description.length < 10) {
    return NextResponse.json({ error: 'Description trop courte (10 caractères minimum)' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Upload photo si présente
  let photoDocId: string | null = null
  if (file && file.size > 0) {
    const MAX = 10 * 1024 * 1024
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (file.size > MAX) return NextResponse.json({ error: 'Photo trop grande (max 10 Mo)' }, { status: 400 })
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Format non supporté (JPG, PNG, WEBP)' }, { status: 400 })

    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${lot.copropriete.cabinet_id}/signalements/${user.id}/${Date.now()}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const { error: uploadErr } = await admin.storage.from('documents').upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      })
      if (!uploadErr) {
        const { data: doc } = await admin.from('documents').insert({
          cabinet_id: lot.copropriete.cabinet_id,
          copropriete_id: lot.copropriete.id,
          nom: `Signalement photo — ${zone || 'Partie commune'}`,
          categorie: 'sinistre',
          taille_bytes: file.size,
          type_mime: file.type,
          storage_path: path,
          storage_bucket: 'documents',
          visible_coproprietaires: false,
          upload_par: user.id,
        }).select('id').single()
        if (doc) photoDocId = doc.id
      }
    } catch (err) {
      captureException(err, { context: 'signalement-photo-upload' })
    }
  }

  // Titre du sinistre
  const zonesLabels: Record<string, string> = {
    hall:      'Hall d\'entrée',
    escaliers: 'Escaliers / Cage d\'escalier',
    palier:    'Palier',
    cave:      'Cave / Sous-sol',
    toiture:   'Toiture / Terrasse',
    facade:    'Façade / Extérieur',
    parking:   'Parking / Garage',
    parties_communes: 'Parties communes',
    autre:     'Parties communes',
  }
  const zoneLabel = zonesLabels[zone] || 'Parties communes'
  const nomDeclarant = [profile.prenom, profile.nom].filter(Boolean).join(' ') || 'Copropriétaire'
  const ref = `SIG-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`

  const statusFromUrgence = urgence === 'urgence' ? 'urgence' : 'signale'
  const titre = `[Signalement] ${zoneLabel} — Lot ${lot.numero}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sinistre, error: sinErr } = await admin.from('sinistres').insert({
    titre,
    description: `Signalement de ${nomDeclarant} (Lot ${lot.numero})\n\nZone : ${zoneLabel}\nUrgence : ${urgence}\n\n${description}`,
    copropriete_id: lot.copropriete.id,
    cabinet_id: lot.copropriete.cabinet_id,
    status: statusFromUrgence,
    reference: ref,
    lots_concernes: [lot.id],
  } as any).select('id').single()

  if (sinErr) {
    return NextResponse.json({ error: 'Erreur lors de la création du signalement' }, { status: 500 })
  }

  // Lier la photo au sinistre si uploadée
  if (photoDocId && sinistre?.id) {
    try { await admin.from('documents').update({ sinistre_id: sinistre.id }).eq('id', photoDocId) } catch { /* ignore */ }
  }

  // Notifier tous les membres du cabinet
  try {
    const { data: members } = await admin.from('profiles').select('id').eq('cabinet_id', lot.copropriete.cabinet_id).in('role', ['owner', 'manager'])
    if (members?.length) {
      await admin.from('notifications').insert(
        members.map((m: { id: string }) => ({
          user_id: m.id,
          cabinet_id: lot.copropriete.cabinet_id,
          type: urgence === 'urgence' ? 'urgent' : 'alerte',
          titre: `Signalement copropriétaire : ${zoneLabel}`,
          message: `Lot ${lot.numero} — ${description.slice(0, 100)}`,
          lien: `/sinistres/${sinistre.id}`,
          sinistre_id: sinistre.id,
          lu: false,
        }))
      )
    }
  } catch (err) {
    captureException(err, { context: 'signalement-notification' })
  }

  return NextResponse.json({ id: sinistre.id, reference: ref })
})
