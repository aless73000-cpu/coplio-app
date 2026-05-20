import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { requireCabinetUser } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'

export async function GET(request: Request) {
  try {
    const ctx = await requireCabinetUser()
    if (ctx instanceof NextResponse) return ctx

    const { supabase, cabinetId } = ctx
    const { searchParams } = new URL(request.url)
    const coproprieteId = searchParams.get('copropriete_id')
    const type = searchParams.get('type')

    let query = supabase
      .from('archives')
      .select('*, copropriete:coproprietes(id, nom)')
      .eq('cabinet_id', cabinetId)
      .order('created_at', { ascending: false })

    if (coproprieteId) query = query.eq('copropriete_id', coproprieteId)
    if (type) query = query.eq('type', type)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    captureException(err, { context: 'archives-get' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireCabinetUser()
    if (ctx instanceof NextResponse) return ctx

    const { supabase, userId, cabinetId } = ctx
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
    const path = `${cabinetId}/archives/${Date.now()}_${hash.slice(0, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, Buffer.from(buffer), { contentType: file.type })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)

    const retention = new Date()
    retention.setFullYear(retention.getFullYear() + 10)

    const { data, error } = await supabase
      .from('archives')
      .insert({
        cabinet_id: cabinetId,
        copropriete_id: coproprieteId || null,
        type,
        nom,
        fichier_url: publicUrl,
        taille_octets: file.size,
        hash_sha256: hash,
        date_document: dateDocument ? new Date(dateDocument).toISOString() : null,
        retention_jusqu_au: retention.toISOString(),
        created_by: userId,
      })
      .select('*, copropriete:coproprietes(id, nom)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    captureException(err, { context: 'archives-post' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
