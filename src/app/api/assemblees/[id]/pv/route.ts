import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'

export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id')
      .eq('id', user.id)
      .single()
    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 403 })

    const admin = createAdminClient()

    // Vérifier que l'AG appartient au cabinet
    const { data: ag } = await admin
      .from('assemblees_generales')
      .select('id, cabinet_id, titre, copropriete_id')
      .eq('id', params.id)
      .single()

    if (!ag || ag.cabinet_id !== profile.cabinet_id) {
      return NextResponse.json({ error: 'AG introuvable' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

    const ext = file.name.split('.').pop() || 'pdf'
    const path = `${profile.cabinet_id}/pv/${params.id}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload dans le bucket documents
    const { error: uploadError } = await admin.storage
      .from('documents')
      .upload(path, buffer, {
        contentType: file.type || 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Erreur upload : ${uploadError.message}` }, { status: 500 })
    }

    // Créer l'entrée document
    const nom = `PV AG - ${ag.titre ?? 'Assemblée générale'}`
    const { data: doc, error: docError } = await admin
      .from('documents')
      .insert({
        cabinet_id: profile.cabinet_id,
        copropriete_id: ag.copropriete_id,
        nom,
        categorie: 'pv_ag',
        taille_bytes: file.size,
        type_mime: file.type || 'application/pdf',
        storage_path: path,
        storage_bucket: 'documents',
        visible_coproprietaires: true,
      })
      .select('id')
      .single()

    if (docError) return NextResponse.json({ error: docError.message }, { status: 500 })

    // Lier le PV à l'AG
    const { error: updateError } = await admin
      .from('assemblees_generales')
      .update({ pv_document_id: doc.id })
      .eq('id', params.id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    return NextResponse.json({ success: true, document_id: doc.id })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})

export const DELETE = withErrorHandler(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id')
      .eq('id', user.id)
      .single()
    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 403 })

    const admin = createAdminClient()

    const { error } = await admin
      .from('assemblees_generales')
      .update({ pv_document_id: null })
      .eq('id', params.id)
      .eq('cabinet_id', profile.cabinet_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
