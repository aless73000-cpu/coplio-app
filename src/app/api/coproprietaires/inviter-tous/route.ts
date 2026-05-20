// POST /api/coproprietaires/inviter-tous
// Envoie une invitation portail à tous les copropriétaires
// qui n'ont pas encore activé leur portail et ont un email.
// Limite : 1 invitation / copropriétaire toutes les 24h.

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Email } from '@/lib/email'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: syndicProfile } = await supabase
      .from('profiles')
      .select('cabinet_id, role')
      .eq('id', user.id)
      .single()

    if (!syndicProfile?.cabinet_id || syndicProfile.role === 'owner_resident') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Récupérer tous les copropriétaires sans portail actif, avec email
    const { data: copros } = await admin
      .from('coproprietaires')
      .select('id, prenom, nom, email, invitation_envoyee_at')
      .eq('cabinet_id', syndicProfile.cabinet_id)
      .eq('portail_actif', false)
      .not('email', 'is', null)

    if (!copros || copros.length === 0) {
      return NextResponse.json({ success: true, sent: 0, skipped: 0, failed: 0, message: 'Tous les copropriétaires ont déjà un portail actif' })
    }

    // Récupérer le cabinet
    const { data: cabinet } = await admin
      .from('cabinets')
      .select('nom')
      .eq('id', syndicProfile.cabinet_id)
      .single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'
    const redirectTo = `${appUrl}/api/auth/callback?next=/accueil`

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    let sent = 0
    let skipped = 0
    let failed = 0

    for (const copro of copros) {
      // Sauter si déjà invité dans les dernières 24h
      if (copro.invitation_envoyee_at && copro.invitation_envoyee_at > oneDayAgo) {
        skipped++
        continue
      }

      try {
        // Lot associé pour le nom de copropriété
        const { data: junctions } = await admin
          .from('coproprietaire_lots')
          .select('lot_id, lot:lots(copropriete:coproprietes(nom))')
          .eq('coproprietaire_id', copro.id)
          .limit(1)

        type Junction = { lot_id: string; lot: { copropriete: { nom: string } | null } | null }
        const nomCopropriete = (junctions?.[0] as unknown as Junction | undefined)?.lot?.copropriete?.nom ?? 'votre résidence'
        const lotId = junctions?.[0]?.lot_id ?? null

        // Générer le lien d'invitation
        let { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
          type: 'invite',
          email: copro.email!,
          options: {
            data: {
              role: 'owner_resident',
              coproprietaire_id: copro.id,
              cabinet_id: syndicProfile.cabinet_id,
              lot_id: lotId,
              prenom: copro.prenom,
              nom: copro.nom,
            },
            redirectTo,
          },
        })

        // Fallback magiclink si email déjà enregistré
        if (linkError?.status === 422) {
          ;({ data: linkData, error: linkError } = await admin.auth.admin.generateLink({
            type: 'magiclink',
            email: copro.email!,
            options: {
              redirectTo,
              data: {
                role: 'owner_resident',
                coproprietaire_id: copro.id,
                cabinet_id: syndicProfile.cabinet_id,
                lot_id: lotId,
                prenom: copro.prenom,
                nom: copro.nom,
              },
            },
          }))
        }

        if (linkError || !linkData?.properties?.action_link) {
          failed++
          continue
        }

        const emailResult = await Email.invitation({
          prenom: copro.prenom,
          nom: copro.nom,
          cabinetNom: cabinet?.nom ?? 'Votre syndic',
          nomCopropriete,
          magicLink: linkData.properties.action_link,
        }, copro.email!)

        if (emailResult.success) {
          await admin
            .from('coproprietaires')
            .update({ invitation_envoyee_at: new Date().toISOString() })
            .eq('id', copro.id)
          sent++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    return NextResponse.json({ success: true, sent, skipped, failed })
  } catch (err) {
    console.error('[inviter-tous]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
