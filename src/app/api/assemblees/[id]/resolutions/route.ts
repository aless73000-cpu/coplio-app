import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-handler'

export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
      .select('id, cabinet_id')
      .eq('id', (await params).id)
      .single()

    if (!ag || ag.cabinet_id !== profile.cabinet_id) {
      return NextResponse.json({ error: 'AG introuvable' }, { status: 404 })
    }

    const body = await request.json()
    const { titre, description, type_vote, ordre } = body

    if (!titre || typeof titre !== 'string' || titre.trim().length < 2) {
      return NextResponse.json({ error: 'Titre invalide' }, { status: 400 })
    }

    const validTypes = ['art_24', 'art_25', 'art_26', 'unanimite']
    if (!validTypes.includes(type_vote)) {
      return NextResponse.json({ error: 'Type de vote invalide' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('ag_resolutions')
      .insert({
        ag_id: (await params).id,
        titre: titre.trim(),
        description: description?.trim() || null,
        type_vote,
        ordre: typeof ordre === 'number' ? ordre : 999,
        voix_pour: 0,
        voix_contre: 0,
        voix_abstention: 0,
        tantiemes_pour: 0,
        tantiemes_contre: 0,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})

export const DELETE = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const url = new URL(request.url)
    const resolutionId = url.searchParams.get('resolution_id')
    if (!resolutionId) return NextResponse.json({ error: 'ID résolution manquant' }, { status: 400 })

    const admin = createAdminClient()

    // Vérifier que l'AG appartient au cabinet
    const { data: ag } = await admin
      .from('assemblees_generales')
      .select('id, cabinet_id')
      .eq('id', (await params).id)
      .single()

    if (!ag || ag.cabinet_id !== profile.cabinet_id) {
      return NextResponse.json({ error: 'AG introuvable' }, { status: 404 })
    }

    const { error } = await admin
      .from('ag_resolutions')
      .delete()
      .eq('id', resolutionId)
      .eq('ag_id', (await params).id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
