import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-handler'

const schema = z.object({
  prenom: z.string().min(1),
  nom: z.string().min(1),
  telephone: z.string().optional(),
  nomCabinet: z.string().min(2),
  siret: z.string().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  telephoneCabinet: z.string().optional(),
  emailContact: z.string().email().optional().or(z.literal('')),
})

export const POST = withErrorHandler(async (request: Request) => {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const { prenom, nom, telephone, nomCabinet, siret, adresse, codePostal, ville, telephoneCabinet, emailContact } = parsed.data
    const admin = createAdminClient()

    // 1. Créer le cabinet (admin bypasse RLS)
    const { data: cabinet, error: cabinetError } = await admin
      .from('cabinets')
      .insert({
        nom: nomCabinet,
        siret: siret || null,
        adresse: adresse || null,
        code_postal: codePostal || null,
        ville: ville || null,
        telephone: telephoneCabinet || null,
        email_contact: emailContact || user.email,
        plan: 'trial',
        subscription_status: 'trialing',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (cabinetError) throw cabinetError

    // 2. Mettre à jour le profil
    const { error: profileError } = await admin
      .from('profiles')
      .update({
        cabinet_id: cabinet.id,
        prenom,
        nom,
        telephone: telephone || null,
        role: 'owner',
        onboarding_complete: true,
      })
      .eq('id', user.id)

    if (profileError) throw profileError

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
})
