import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { cotisation_annuelle, solde_actuel, objectif_5ans, compte_bancaire, notes } = body

    const { data, error } = await supabase
      .from('fonds_travaux')
      .update({ cotisation_annuelle, solde_actuel, objectif_5ans, compte_bancaire, notes, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[API Error]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // Add mouvement
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { type, montant, libelle, date_mouvement } = body

    if (!type || !montant) return NextResponse.json({ error: 'type et montant requis' }, { status: 400 })

    const { data: mouvement, error: mErr } = await supabase
      .from('fonds_travaux_mouvements')
      .insert({ fonds_travaux_id: params.id, type_mouvement: type, montant, libelle, date_mouvement: date_mouvement ?? new Date().toISOString().split('T')[0] })
      .select()
      .single()

    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

    // Update solde
    const { data: ft } = await supabase.from('fonds_travaux').select('solde_actuel').eq('id', params.id).single()
    const delta = type === 'retrait' ? -Math.abs(montant) : Math.abs(montant)
    await supabase.from('fonds_travaux').update({ solde_actuel: (ft?.solde_actuel ?? 0) + delta }).eq('id', params.id)

    return NextResponse.json(mouvement)
  } catch (err) {
    console.error('[API Error]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { error } = await supabase.from('fonds_travaux').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API Error]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
