import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: appel } = await supabase.from('appels_charges').select('montant').eq('id', params.id).single()
    if (!appel) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    const { error } = await supabase.from('appels_charges')
      .update({ paye: true, montant_paye: appel.montant, date_paiement: new Date().toISOString() })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
