import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Email } from '@/lib/email'
import { formatEuro, formatDate } from '@/lib/utils'

export async function POST(
  _req: Request,
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

    // Récupérer l'appel de charges + lot + copropriété
    const { data: appel } = await admin
      .from('appels_charges')
      .select(`
        *,
        copropriete:coproprietes(id, nom, cabinet_id),
        lot:lots(id, numero)
      `)
      .eq('id', params.id)
      .eq('paye', false)
      .single()

    if (!appel) return NextResponse.json({ error: 'Appel introuvable' }, { status: 404 })

    // Vérifier que l'appel appartient au cabinet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((appel.copropriete as any)?.cabinet_id !== profile.cabinet_id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Récupérer le copropriétaire (owner_resident lié au lot)
    const { data: ownerProfile } = await admin
      .from('profiles')
      .select('prenom, nom, email')
      .eq('lot_id', appel.lot_id)
      .eq('role', 'owner_resident')
      .single()

    if (!ownerProfile?.email) {
      return NextResponse.json({ error: 'Copropriétaire sans email — invitation non envoyée' }, { status: 400 })
    }

    // Récupérer le cabinet pour le nom
    const { data: cabinet } = await admin
      .from('cabinets')
      .select('nom')
      .eq('id', profile.cabinet_id)
      .single()

    // Déterminer le niveau de relance
    const niveau = Math.min(appel.nb_relances + 1, 3) as 1 | 2 | 3

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'

    const result = await Email.relanceImpayes(
      {
        prenom: ownerProfile.prenom ?? '',
        nom: ownerProfile.nom ?? '',
        montant: formatEuro(appel.montant - appel.montant_paye),
        dateEcheance: formatDate(appel.date_echeance),
        cabinetNom: cabinet?.nom ?? 'Votre syndic',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nomCopropriete: (appel.copropriete as any)?.nom ?? 'votre résidence',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        numeroLot: (appel.lot as any)?.numero ?? '',
        niveau,
        portailUrl: `${appUrl}/mes-charges`,
      },
      ownerProfile.email
    )

    if (!result.success) {
      return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 })
    }

    // Mettre à jour le compteur de relances
    await admin
      .from('appels_charges')
      .update({
        nb_relances: appel.nb_relances + 1,
        derniere_relance_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    return NextResponse.json({ success: true, niveau, emailId: result.emailId })
  } catch (err) {
    console.error('[Relance impayé]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
