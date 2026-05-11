import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const admin = createAdminClient()
    const { data: appel } = await admin
      .from('appels_charges')
      .select('*, lot:lots(coproprietaire_lots(coproprietaire:coproprietaires(prenom, nom, email)))')
      .eq('id', params.id)
      .single()

    if (!appel) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    // Incrémenter le compteur de relances
    await admin.from('appels_charges').update({
      nb_relances: (appel.nb_relances ?? 0) + 1,
      derniere_relance_at: new Date().toISOString(),
    }).eq('id', params.id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
