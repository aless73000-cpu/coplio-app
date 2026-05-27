import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Email } from '@/lib/email'
import { withErrorHandler } from '@/lib/api-handler'
import { captureException } from '@/lib/monitoring'
import { logAction } from '@/lib/audit'

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

export const POST = withErrorHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('cabinet_id')
    .eq('id', user.id)
    .single()
  if (!profile?.cabinet_id) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 403 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createAdminClient()

  // SEC-01 : vérifier que toutes les copropriete_id appartiennent au cabinet de l'utilisateur
  const coproprieteIds = Array.from(new Set(parsed.data.appels.map(a => a.copropriete_id)))
  const { data: coprosVerif } = await admin
    .from('coproprietes')
    .select('id')
    .in('id', coproprieteIds)
    .eq('cabinet_id', profile.cabinet_id)

  if ((coprosVerif?.length ?? 0) !== coproprieteIds.length) {
    return NextResponse.json({ error: 'Copropriété non autorisée' }, { status: 403 })
  }

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
  sendNotificationsCharges(admin, parsed.data.appels).catch(err => captureException(err, { context: 'appels-charges-notify' }))

  // ─── Générer les écritures comptables (non bloquant) ─────────
  genererEcrituresAppels(admin, parsed.data.appels, user.id).catch(() => {})
  // ─────────────────────────────────────────────────────────────

  await logAction(admin, {
    cabinet_id: profile.cabinet_id, user_id: user.id,
    action: 'create', entite: 'appel_charges',
    entite_nom: parsed.data.appels[0]?.libelle,
    metadata: { count: data?.length ?? 0 },
  })

  return NextResponse.json({ data, count: data?.length ?? 0 })
})

async function sendNotificationsCharges(
  admin: ReturnType<typeof import('@/lib/supabase/server').createAdminClient>,
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

/**
 * Génère automatiquement les écritures comptables pour chaque appel de charges créé.
 * Schéma : Débit 410 (Copropriétaires – charges à recevoir) / Crédit 701 (Produits des charges)
 * Si le journal OD ou les comptes n'existent pas → silencieux (pas bloquant)
 */
async function genererEcrituresAppels(
  admin: ReturnType<typeof import('@/lib/supabase/server').createAdminClient>,
  appels: z.infer<typeof appelSchema>[],
  userId: string,
) {
  // Grouper par copropriété pour minimiser les requêtes
  const parCopro = appels.reduce((acc, a) => {
    if (!acc[a.copropriete_id]) acc[a.copropriete_id] = []
    acc[a.copropriete_id].push(a)
    return acc
  }, {} as Record<string, typeof appels>)

  for (const [coproprieteId, appellsCopro] of Object.entries(parCopro)) {
    // Journal OD (opérations diverses)
    const { data: journalOD } = await admin
      .from('journaux')
      .select('id')
      .eq('copropriete_id', coproprieteId)
      .eq('type_journal', 'od')
      .eq('actif', true)
      .limit(1)
      .single()

    if (!journalOD) continue

    // Exercice en cours
    const { data: exercice } = await admin
      .from('exercices')
      .select('id')
      .eq('copropriete_id', coproprieteId)
      .eq('statut', 'en_cours')
      .order('annee', { ascending: false })
      .limit(1)
      .single()

    // Comptes : 410 (créances) + 701 (produits)
    const { data: comptes } = await admin
      .from('comptes_comptables')
      .select('id, numero')
      .is('cabinet_id', null)
      .or('numero.like.410%,numero.like.701%')
      .eq('type_compte', 'detail')

    const compte410 = (comptes ?? []).find(c => c.numero.startsWith('410'))
    const compte701 = (comptes ?? []).find(c => c.numero.startsWith('701'))

    if (!compte410 || !compte701) continue

    for (const appel of appellsCopro) {
      const { data: ecriture } = await admin
        .from('ecritures_comptables')
        .insert({
          copropriete_id: coproprieteId,
          journal_id:     journalOD.id,
          exercice_id:    exercice?.id ?? null,
          date_ecriture:  appel.date_appel,
          libelle:        `Appel de charges — ${appel.libelle}`,
          statut:         'valide',
          created_by:     userId,
        })
        .select('id')
        .single()

      if (!ecriture) continue

      await admin.from('lignes_ecriture').insert([
        {
          ecriture_id: ecriture.id,
          compte_id:   compte410.id,
          debit:       appel.montant,
          credit:      0,
          libelle:     appel.libelle,
          ordre:       0,
        },
        {
          ecriture_id: ecriture.id,
          compte_id:   compte701.id,
          debit:       0,
          credit:      appel.montant,
          libelle:     appel.libelle,
          ordre:       1,
        },
      ])
    }
  }
}
