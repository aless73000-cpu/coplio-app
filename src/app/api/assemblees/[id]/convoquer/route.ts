import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail, emailConvocationAG } from '@/lib/resend'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('cabinet_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.cabinet_id || profile.role === 'owner_resident') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Récupérer l'AG + résolutions
    const { data: ag } = await admin
      .from('assemblees_generales')
      .select('*, copropriete:coproprietes(id, nom), resolutions:resolutions_ag(titre, ordre)')
      .eq('id', params.id)
      .eq('cabinet_id', profile.cabinet_id)
      .single()

    if (!ag) return NextResponse.json({ error: 'AG introuvable' }, { status: 404 })
    if (ag.status === 'terminee' || ag.status === 'annulee') {
      return NextResponse.json({ error: 'AG terminée ou annulée' }, { status: 400 })
    }

    const { data: cabinet } = await admin
      .from('cabinets')
      .select('nom')
      .eq('id', profile.cabinet_id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coproprieteId = (ag.copropriete as any)?.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nomCopropriete = (ag.copropriete as any)?.nom ?? 'votre résidence'

    // Récupérer tous les copropriétaires de la résidence
    const { data: lots } = await admin
      .from('lots')
      .select('id, numero')
      .eq('copropriete_id', coproprieteId)

    const lotIds = (lots ?? []).map((l: { id: string }) => l.id)

    const { data: profiles } = await admin
      .from('profiles')
      .select('prenom, nom, email, lot_id')
      .in('lot_id', lotIds)
      .eq('role', 'owner_resident')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'
    const dateAg = new Date(ag.date_ag)
    const listeResolutions = ((ag.resolutions ?? []) as { titre: string; ordre: number }[])
      .sort((a, b) => a.ordre - b.ordre)
      .map(r => r.titre)

    // Envoyer les convocations
    let sent = 0
    for (const p of profiles ?? []) {
      if (!p.email) continue
      await sendEmail({
        to: p.email,
        subject: `Convocation AG — ${nomCopropriete}`,
        html: emailConvocationAG({
          prenom: p.prenom ?? '',
          nom: p.nom ?? '',
          cabinetNom: cabinet?.nom ?? 'Votre syndic',
          nomCopropriete,
          dateAg: dateAg.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          heure: dateAg.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          lieu: ag.lieu ?? 'À définir',
          listeResolutions,
          lienVote: `${appUrl}/mes-assemblees`,
        }),
      })
      sent++
    }

    // Mettre à jour le statut de l'AG
    await admin
      .from('assemblees_generales')
      .update({
        status: 'convocations_envoyees',
        convocations_envoyees_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    return NextResponse.json({ success: true, sent })
  } catch (err) {
    console.error('Convocation error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
