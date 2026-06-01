import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { captureException } from '@/lib/monitoring'
import { logAction } from '@/lib/audit'

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

    const limit = await rateLimit(`upload:${user.id}`, { max: 20, windowMs: 60_000 })
    if (!limit.success) return rateLimitResponse(limit.resetAt)

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const nom = (formData.get('nom') as string)?.trim()
    const categorie = formData.get('categorie') as string || 'autre'
    const coproprieteId = (formData.get('copropriete_id') as string) || null
    const description = (formData.get('description') as string)?.trim() || null
    const visibleCoproprietaires = formData.get('visible_coproprietaires') === 'true'
    const visibleLocataires = formData.get('visible_locataires') === 'true'

    if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    if (!nom) return NextResponse.json({ error: 'Nom manquant' }, { status: 400 })

    const MAX_SIZE = 50 * 1024 * 1024 // 50 MB
    const ALLOWED_TYPES = [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/plain', 'text/csv',
    ]
    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: 'Fichier trop grand (max 50 MB)' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type))
      return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 })

    const admin = createAdminClient()

    // Upload vers Supabase Storage avec le client admin (service_role)
    const ext = file.name.split('.').pop() || 'bin'
    const path = `${profile.cabinet_id}/${user.id}/${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await admin.storage
      .from('documents')
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Erreur upload : ${uploadError.message}` }, { status: 500 })
    }

    // Enregistrer en base avec admin (bypass RLS)
    const { data: doc, error: dbError } = await admin
      .from('documents')
      .insert({
        cabinet_id: profile.cabinet_id,
        copropriete_id: coproprieteId || null,
        nom,
        description,
        categorie: categorie as 'pv_ag' | 'budget' | 'contrat' | 'sinistre' | 'appel_fonds' | 'reglement' | 'autre',
        taille_bytes: file.size,
        type_mime: file.type || null,
        storage_path: path,
        storage_bucket: 'documents',
        visible_coproprietaires: visibleCoproprietaires,
        visible_locataires: visibleLocataires,
        upload_par: user.id,
      })
      .select()
      .single()

    if (dbError) {
      // Rollback du fichier uploadé
      await admin.storage.from('documents').remove([path])
      return NextResponse.json({ error: `Erreur base de données : ${dbError.message}` }, { status: 500 })
    }

    // Si visible aux copropriétaires et lié à une copropriété → notification
    if (visibleCoproprietaires && coproprieteId) {
      try {
        const { data: lots } = await admin
          .from('lots')
          .select('id')
          .eq('copropriete_id', coproprieteId)

        const lotIds = (lots ?? []).map((l: { id: string }) => l.id)
        if (lotIds.length > 0) {
          const { data: residents } = await admin
            .from('profiles')
            .select('id')
            .in('lot_id', lotIds)
            .eq('role', 'owner_resident')

          if (residents?.length) {
            await admin.from('notifications').insert(
              residents.map((r: { id: string }) => ({
                user_id: r.id,
                type: 'info',
                titre: `Nouveau document disponible`,
                message: nom,
                lu: false,
              }))
            )
          }
        }
      } catch { /* non bloquant */ }
    }

    await logAction(admin, {
      cabinet_id: profile.cabinet_id,
      user_id: user.id,
      action: 'upload',
      entite: 'document',
      entite_id: doc.id,
      entite_nom: nom,
      metadata: { categorie, taille_bytes: file.size },
    })

    return NextResponse.json(doc)
  } catch (err) {
    captureException(err, { context: 'documents-upload' })
    return NextResponse.json({ error: 'Erreur inattendue' }, { status: 500 })
  }
})
