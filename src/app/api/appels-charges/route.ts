import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Email } from '@/lib/email'
import { captureException } from '@/lib/monitoring'

// Augmentation du timeout Vercel pour l'envoi d'emails en batch (100 lots = ~20s)
export const maxDuration = 60

const appelSchema = z.object({
  copropriete_id: z.string().uuid(),
  lot_id: z.string().uuid(),
  libelle: z.string().min(1),
  montant: z.number().positive(),
  date_appel: z.string(),
  date_echeance: z.string(),
})

const schema = z.object({
  appels: z.array(appelSchema).min(1),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
    }

    const admin = createAdminClient()

    const appelsData = parsed.data.appels.map((appel) => ({
      ...appel,
      montant_paye: 0,
      nb_relances: 0,
    }))

    const { data, error } = await admin
      .from('appels_charges')
      .insert(appelsData)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Envoyer des emails aux copropriétaires concernés (non bloquant)
    sendNotificationsCharges(admin, parsed.data.appels).catch((e) => captureException(e, { context: 'appels-charges-notifications' }))

    return NextResponse.json({ data, count: data?.length ?? 0 })
  } catch (err) {
    captureException(err, { context: 'appels-charges-post' })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function sendNotificationsCharges(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  appels: z.infer<typeof appelSchema>[]
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coplio.fr'
  const fmtEuro = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  // Regrouper par lot_id unique pour éviter les doublons
  const uniqueLots = Array.from(new Set(appels.map(a => a.lot_id)))

  for (const lotId of uniqueLots) {
    // Récupérer le profil du copropriétaire lié à ce lot
    const { data: profile } = await admin
      .from('profiles')
      .select('prenom, nom, email')
      .eq('lot_id', lotId)
      .eq('role', 'owner_resident')
      .single()

    if (!profile?.email) continue

    // Récupérer les infos du lot + copropriété
    const { data: lot } = await admin
      .from('lots')
      .select('numero, copropriete:coproprietes(nom)')
      .eq('id', lotId)
      .single()

    if (!lot) continue

    const nomCopropriete = (lot.copropriete as { nom: string } | null)?.nom ?? 'votre résidence'
    const lotAppels = appels.filter(a => a.lot_id === lotId)

    // Un email par appel
    for (const appel of lotAppels) {
      await Email.appelCharges({
        prenom: profile.prenom ?? '',
        nom: profile.nom ?? '',
        libelle: appel.libelle,
        montant: fmtEuro(appel.montant),
        dateEcheance: fmtDate(appel.date_echeance),
        nomCopropriete,
        numeroLot: lot.numero,
        portailUrl: `${appUrl}/mes-charges`,
      }, profile.email)
    }
  }
}
