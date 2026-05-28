import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'
export const GET = withErrorHandler(async (request: Request) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
    if (!profile?.cabinet_id) return NextResponse.json([])

    const { searchParams } = new URL(request.url)
    const coproprieteId = searchParams.get('copropriete_id')
    const type = searchParams.get('type')

    let query = supabase
      .from('archives')
      .select('*, copropriete:coproprietes(id, nom)')
      .eq('cabinet_id', profile.cabinet_id)
      .order('created_at', { ascending: false })

    if (coproprieteId) query = query.eq('copropriete_id', coproprieteId)
    if (type) query = query.eq('type', type)

    const { data, error } = await query.limit(500)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    captureException(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})

export const POST = withErrorHandler(async (request: Request) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single()
    if (!profile?.cabinet_id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const nom = formData.get('nom') as string
    const type = (formData.get('type') as string) ?? 'autre'
    const coproprieteId = formData.get('copropriete_id') as string | null
    const dateDocument = formData.get('date_document') as string | null

    if (!file || !nom) return NextResponse.json({ error: 'Fichier et nom requis' }, { status: 400 })
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'Fichier trop grand (max 20MB)' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const hash = createHash('sha256').update(Buffer.from(buffer)).digest('hex')
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${profile.cabinet_id}/archives/${Date.now()}_${hash.slice(0, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, Buffer.from(buffer), { contentType: file.type })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)

    // Rétention 10 ans
    const retention = new Date()
    retention.setFullYear(retention.getFullYear() + 10)

    const { data, error } = await supabase
      .from('archives')
      .insert({
        cabinet_id: profile.cabinet_id,
        copropriete_id: coproprieteId || null,
        type,
        nom,
        fichier_url: publicUrl,
        taille_octets: file.size,
        hash_sha256: hash,
        date_document: dateDocument ? new Date(dateDocument).toISOString() : null,
        retention_jusqu_au: retention.toISOString(),
        created_by: user.id,
      })
      .select('*, copropriete:coproprietes(id, nom)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    captureException(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
