import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Email } from '@/lib/email'
import { captureException } from '@/lib/monitoring'
import { logAction } from '@/lib/audit'

/** Génère un mot de passe temporaire de 12 caractères sans ambiguïtés (0/O/1/I/l) */
function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const all = upper + lower + digits
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)]
  const required = [pick(upper), pick(upper), pick(lower), pick(lower), pick(digits), pick(digits)]
  const extra = Array.from({ length: 6 }, () => pick(all))
  return [...required, ...extra].sort(() => Math.random() - 0.5).join('')
}

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
      .select('id, prenom, nom, email, profile_id, portail_actif')
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
    const portailUrl = `${appUrl}/portail`

    // Générer le mot de passe temporaire
    const tempPassword = generateTempPassword()

    // Créer ou mettre à jour l'utilisateur Supabase Auth
    let authUserId: string | null = copro.profile_id ?? null

    if (authUserId) {
      // Utilisateur existant → mettre à jour le mot de passe
      const { error: updateError } = await admin.auth.admin.updateUserById(authUserId, {
        password: tempPassword,
        email_confirm: true,
      })
      if (updateError) {
        captureException(updateError, { context: 'inviter-updateUser' })
        return NextResponse.json({ error: 'Erreur mise à jour utilisateur' }, { status: 500 })
      }
    } else {
      // Chercher si un compte existe déjà avec cet email via la table profiles (plus efficace que listUsers)
      const { data: existingProfile } = await admin
        .from('profiles')
        .select('id')
        .eq('email', copro.email)
        .maybeSingle()
      const existing = existingProfile ? { id: existingProfile.id } : null

      if (existing) {
        authUserId = existing.id
        const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
          password: tempPassword,
          email_confirm: true,
        })
        if (updateError) {
          captureException(updateError, { context: 'inviter-updateExistingUser' })
          return NextResponse.json({ error: 'Erreur mise à jour utilisateur' }, { status: 500 })
        }
      } else {
        // Créer un nouvel utilisateur
        const { data: newUser, error: createError } = await admin.auth.admin.createUser({
          email: copro.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            prenom: copro.prenom,
            nom: copro.nom,
            role: 'owner_resident',
          },
        })
        if (createError || !newUser?.user) {
          captureException(createError ?? new Error('createUser returned no user'), { context: 'inviter-createUser' })
          return NextResponse.json({ error: 'Erreur création utilisateur' }, { status: 500 })
        }
        authUserId = newUser.user.id
      }
    }

    // Créer ou mettre à jour le profil
    await admin
      .from('profiles')
      .upsert({
        id: authUserId,
        email: copro.email,
        prenom: copro.prenom,
        nom: copro.nom,
        role: 'owner_resident',
        cabinet_id: syndicProfile.cabinet_id,
        lot_id: lotId ?? null,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    // Mettre à jour le copropriétaire
    await admin
      .from('coproprietaires')
      .update({
        portail_actif: true,
        profile_id: authUserId,
        invitation_envoyee_at: new Date().toISOString(),
      })
      .eq('id', copro.id)

    // Envoyer l'email avec les identifiants
    const emailResult = await Email.invitation({
      prenom: copro.prenom,
      nom: copro.nom,
      cabinetNom: cabinet?.nom ?? 'Votre syndic',
      nomCopropriete,
      tempPassword,
      portailUrl,
    }, copro.email)

    if (!emailResult.success) {
      return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 })
    }

    await logAction(admin, {
      cabinet_id: syndicProfile.cabinet_id!,
      user_id: user.id,
      action: 'invite',
      entite: 'coproprietaire',
      entite_id: copro.id,
      entite_nom: `${copro.prenom} ${copro.nom}`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    captureException(err, { context: 'coproprietaires-inviter' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
