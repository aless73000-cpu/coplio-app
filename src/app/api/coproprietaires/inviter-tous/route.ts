// POST /api/coproprietaires/inviter-tous
// Envoie une invitation portail à tous les copropriétaires
// qui n'ont pas encore activé leur portail et ont un email.
// Limite : 1 invitation / copropriétaire toutes les 24h.

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Email } from '@/lib/email'
import { captureException } from '@/lib/monitoring'

export const runtime = 'nodejs'
export const maxDuration = 60

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
      .select('id, prenom, nom, email, profile_id, invitation_envoyee_at')
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
    const portailUrl = `${appUrl}/portail`
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    let sent = 0
    let skipped = 0
    let failed = 0

    // Charger tous les utilisateurs auth une seule fois pour éviter N appels
    const { data: allUsers } = await admin.auth.admin.listUsers()

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

        const tempPassword = generateTempPassword()
        let authUserId: string | null = copro.profile_id ?? null

        if (authUserId) {
          await admin.auth.admin.updateUserById(authUserId, { password: tempPassword, email_confirm: true })
        } else {
          const existing = allUsers?.users?.find(u => u.email === copro.email)
          if (existing) {
            authUserId = existing.id
            await admin.auth.admin.updateUserById(existing.id, { password: tempPassword, email_confirm: true })
          } else {
            const { data: newUser, error: createError } = await admin.auth.admin.createUser({
              email: copro.email!,
              password: tempPassword,
              email_confirm: true,
              user_metadata: { prenom: copro.prenom, nom: copro.nom, role: 'owner_resident' },
            })
            if (createError || !newUser?.user) { failed++; continue }
            authUserId = newUser.user.id
          }
        }

        // Upsert profil
        await admin.from('profiles').upsert({
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

        const emailResult = await Email.invitation({
          prenom: copro.prenom,
          nom: copro.nom,
          cabinetNom: cabinet?.nom ?? 'Votre syndic',
          nomCopropriete,
          tempPassword,
          portailUrl,
        }, copro.email!)

        if (emailResult.success) {
          await admin
            .from('coproprietaires')
            .update({ portail_actif: true, profile_id: authUserId, invitation_envoyee_at: new Date().toISOString() })
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
    captureException(err, { context: 'inviter-tous' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
