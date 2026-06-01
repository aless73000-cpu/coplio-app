import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Email } from '@/lib/email'
import { captureException } from '@/lib/monitoring'
import { withErrorHandler } from '@/lib/api-handler'
import { generateTempPassword } from '@/lib/passwords'

// Le copropriétaire (owner_resident) invite SON locataire pour SON lot.
// Le locataire est un profile role='tenant', cabinet_id=NULL (sécurité RLS),
// lot_id = lot du propriétaire, landlord_id = propriétaire.

const inviteSchema = z.object({
  prenom: z.string().min(1, 'Prénom requis'),
  nom: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
})

type OwnerProfile = {
  id: string; prenom: string | null; nom: string | null; role: string; lot_id: string | null
  lot: unknown
}
type OwnerContext =
  | { ok: false; response: NextResponse }
  | { ok: true; userId: string; profile: OwnerProfile }

/** Récupère le propriétaire connecté + son lot/copropriété. */
async function getOwnerContext(): Promise<OwnerContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, response: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, prenom, nom, role, lot_id, lot:lots(id, numero, copropriete:coproprietes(id, nom))')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner_resident') {
    return { ok: false, response: NextResponse.json({ error: 'Réservé aux copropriétaires' }, { status: 403 }) }
  }
  if (!profile.lot_id) {
    return { ok: false, response: NextResponse.json({ error: 'Aucun lot associé à votre compte' }, { status: 400 }) }
  }
  return { ok: true, userId: user.id, profile: profile as OwnerProfile }
}

// ─── POST : inviter un locataire ──────────────────────────────────
export const POST = withErrorHandler(async (request: Request) => {
  const ctx = await getOwnerContext()
  if (!ctx.ok) return ctx.response
  const { userId, profile } = ctx

  const body = await request.json()
  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides' }, { status: 400 })
  }
  const { prenom, nom, email } = parsed.data

  const admin = createAdminClient()

  // Un seul locataire par propriétaire pour commencer
  const { data: existingTenant } = await admin
    .from('profiles')
    .select('id')
    .eq('landlord_id', userId)
    .eq('role', 'tenant')
    .maybeSingle()
  if (existingTenant) {
    return NextResponse.json({ error: 'Vous avez déjà un locataire. Révoquez-le avant d\'en inviter un autre.' }, { status: 409 })
  }

  const lot = profile.lot as { id: string; numero: string | null; copropriete: { id: string; nom: string } | null } | null
  const nomCopropriete = lot?.copropriete?.nom ?? 'votre résidence'
  const proprietaireNom = [profile.prenom, profile.nom].filter(Boolean).join(' ') || 'Votre propriétaire'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'
  const tempPassword = generateTempPassword()

  // Créer (ou réutiliser) le compte auth
  let tenantId: string
  const { data: existingProfile } = await admin.from('profiles').select('id, role').eq('email', email).maybeSingle()

  if (existingProfile) {
    // Refuser si l'email appartient déjà à un autre rôle (copropriétaire/syndic)
    if (existingProfile.role !== 'tenant') {
      return NextResponse.json({ error: 'Cet email est déjà utilisé par un autre compte.' }, { status: 409 })
    }
    tenantId = existingProfile.id
    const { error: updErr } = await admin.auth.admin.updateUserById(tenantId, { password: tempPassword, email_confirm: true })
    if (updErr) {
      captureException(updErr, { context: 'locataire-updateUser' })
      return NextResponse.json({ error: 'Erreur mise à jour du compte locataire' }, { status: 500 })
    }
  } else {
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { prenom, nom, role: 'tenant' },
    })
    if (createErr || !newUser?.user) {
      captureException(createErr ?? new Error('createUser no user'), { context: 'locataire-createUser' })
      return NextResponse.json({ error: 'Erreur création du compte locataire' }, { status: 500 })
    }
    tenantId = newUser.user.id
  }

  // Profil locataire : cabinet_id NULL (confinement RLS), lot du propriétaire, landlord_id
  const { error: profErr } = await admin.from('profiles').upsert({
    id: tenantId,
    email,
    prenom,
    nom,
    role: 'tenant',
    cabinet_id: null,
    lot_id: profile.lot_id,
    landlord_id: userId,
    onboarding_complete: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })
  if (profErr) {
    captureException(profErr, { context: 'locataire-upsertProfile' })
    return NextResponse.json({ error: 'Erreur création du profil locataire' }, { status: 500 })
  }

  // Email d'invitation (non bloquant : le compte est créé même si Resend n'est pas configuré)
  let emailSent = false
  try {
    const res = await Email.invitationLocataire(
      { prenom, nom, proprietaireNom, nomCopropriete, tempPassword, portailUrl: `${appUrl}/portail` },
      email
    )
    emailSent = res.success
  } catch (err) {
    captureException(err, { context: 'locataire-email' })
  }

  return NextResponse.json({ success: true, emailSent })
})

// ─── DELETE : révoquer le locataire ───────────────────────────────
export const DELETE = withErrorHandler(async () => {
  const ctx = await getOwnerContext()
  if (!ctx.ok) return ctx.response
  const { userId } = ctx

  const admin = createAdminClient()
  const { data: tenant } = await admin
    .from('profiles')
    .select('id')
    .eq('landlord_id', userId)
    .eq('role', 'tenant')
    .maybeSingle()

  if (!tenant) return NextResponse.json({ error: 'Aucun locataire à révoquer' }, { status: 404 })

  // Supprimer le compte auth (le profil suit via FK), best-effort
  const { error: delErr } = await admin.auth.admin.deleteUser(tenant.id)
  if (delErr) {
    captureException(delErr, { context: 'locataire-deleteUser' })
    // fallback : au moins détacher le profil
    await admin.from('profiles').delete().eq('id', tenant.id)
  }

  return NextResponse.json({ success: true })
})
