import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { captureException } from '@/lib/monitoring'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.cabinet_id || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop grand (max 2 Mo)' }, { status: 400 })
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      return NextResponse.json({ error: 'Format non supporté (JPG, PNG, WebP, SVG)' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'png'
    const path = `cabinets/${profile.cabinet_id}/logo.${ext}`

    const admin = createAdminClient()
    const { error: uploadError } = await admin.storage
      .from('logos')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from('logos').getPublicUrl(path)

    await admin
      .from('cabinets')
      .update({ logo_url: publicUrl })
      .eq('id', profile.cabinet_id)

    return NextResponse.json({ logo_url: publicUrl })
  } catch (err) {
    captureException(err, { context: 'cabinet-logo' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
