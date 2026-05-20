import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Email } from '@/lib/email'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Vérifier que l'utilisateur est syndic avec un cabinet
    const { data: syndicProfile } = await supabase
      .from('profiles')
      .select('cabinet_id, role')
      .eq('id', user.id)
      .single()

    if (!syndicProfile?.cabinet_id || syndicProfile.role === 'owner_resident') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Récupérer le copropriétaire
    const { data: copro } = await admin
      .from('coproprietaires')
      .select('id, prenom, nom, email, portail_actif')
      .eq('id', params.id)
      .eq('cabinet_id', syndicProfile.cabinet_id)
      .single()

    if (!copro) return NextResponse.json({ error: 'Copropriétaire introuvable' }, { status: 404 })
    if (!copro.email) return NextResponse.json({ error: 'Email manquant' }, { status: 400 })

    // Récupérer le premier lot du copropriétaire
    const { data: junctions } = await admin
      .from('coproprietaire_lots')
      .select('lot_id, lot:lots(id, copropriete:coproprietes(id, nom))')
      .eq('coproprietaire_id', copro.id)
      .limit(1)

    const firstJunction = junctions?.[0] as {
      lot_id: string
      lot: { id: string; copropriete: { id: string; nom: string } }
    } | undefined

    const lotId = firstJunction?.lot_id
    const nomCopropriete = firstJunction?.lot?.copropriete?.nom ?? 'votre résidence'

    // Récupérer le cabinet
    const { data: cabinet } = await admin
      .from('cabinets')
      .select('nom')
      .eq('id', syndicProfile.cabinet_id)
      .single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'
    const redirectTo = `${appUrl}/api/auth/callback?next=/accueil`

    // Générer le lien d'invitation via Supabase Admin
    // Essai 1 : invite (nouvel utilisateur)
    let { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'invite',
      email: copro.email,
      options: {
        data: {
          role: 'owner_resident',
          coproprietaire_id: copro.id,
          cabinet_id: syndicProfile.cabinet_id,
          lot_id: lotId ?? null,
          prenom: copro.prenom,
          nom: copro.nom,
        },
        redirectTo,
      },
    })

    // Essai 2 : magiclink si l'email est déjà enregistré
    // On passe les mêmes métadonnées pour que le callback puisse identifier l'invitation
    if (linkError?.code === 'email_exists' || linkError?.status === 422) {
      ;({ data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: copro.email,
        options: {
          redirectTo,
          data: {
            role: 'owner_resident',
            coproprietaire_id: copro.id,
            cabinet_id: syndicProfile.cabinet_id,
            lot_id: lotId ?? null,
            prenom: copro.prenom,
            nom: copro.nom,
          },
        },
      }))
    }

    if (linkError || !linkData?.properties?.action_link) {
      console.error('generateLink error:', linkError)
      return NextResponse.json({ error: 'Erreur génération du lien' }, { status: 500 })
    }

    const magicLink = linkData.properties.action_link

    // Envoyer via le nouveau service email
    const emailResult = await Email.invitation({
      prenom: copro.prenom,
      nom: copro.nom,
      cabinetNom: cabinet?.nom ?? 'Votre syndic',
      nomCopropriete,
      magicLink,
    }, copro.email)

    if (!emailResult.success) {
      return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 })
    }

    // Marquer l'invitation comme envoyée
    await admin
      .from('coproprietaires')
      .update({ invitation_envoyee_at: new Date().toISOString() })
      .eq('id', copro.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Invitation error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
