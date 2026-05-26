import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Email } from '@/lib/email'
import { withErrorHandler } from '@/lib/api-handler'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { captureException } from '@/lib/monitoring'

export const POST = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const admin = createAdminClient()

    // Récupère le profil du syndic pour vérifier le cabinet_id
    const { data: profile } = await admin
      .from('profiles')
      .select('cabinet_id, cabinets(nom)')
      .eq('id', user.id)
      .single()

    if (!profile?.cabinet_id) {
      return NextResponse.json({ error: 'Cabinet introuvable' }, { status: 403 })
    }

    const limit = await rateLimit(`relancer:${user.id}`, { max: 15, windowMs: 60_000 })
    if (!limit.success) return rateLimitResponse(limit.resetAt)

    const cabinetNom = (profile.cabinets as unknown as { nom: string } | null)?.nom ?? ''

    // Charge l'appel de charges avec toutes les données nécessaires à l'email.
    // La vérification d'appartenance au cabinet se fait via lots → coproprietes.
    const { data: appel } = await admin
      .from('appels_charges')
      .select(`
        id,
        montant,
        date_echeance,
        libelle,
        nb_relances,
        lot:lots(
          numero,
          copropriete:coproprietes(id, nom, cabinet_id),
          coproprietaire_lots(
            coproprietaire:coproprietaires(prenom, nom, email)
          )
        )
      `)
      .eq('id', id)
      .single()

    if (!appel) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    // Vérification cabinet isolation via la relation lots → coproprietes
    const lot = appel.lot as {
      numero: string
      copropriete: { id: string; nom: string; cabinet_id: string } | null
      coproprietaire_lots: Array<{
        coproprietaire: { prenom: string; nom: string; email: string } | null
      }>
    } | null

    if (lot?.copropriete?.cabinet_id !== profile.cabinet_id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const nouveauNbRelances = (appel.nb_relances ?? 0) + 1

    // Incrémenter le compteur de relances
    await admin.from('appels_charges').update({
      nb_relances: nouveauNbRelances,
      derniere_relance_at: new Date().toISOString(),
    }).eq('id', id)

    // ── Envoi de l'email de relance ─────────────────────────────
    // Niveau : 1 (amical), 2 (ferme), 3 (mise en demeure)
    const niveau = Math.min(nouveauNbRelances, 3) as 1 | 2 | 3

    const coproprietaire = lot?.coproprietaire_lots?.[0]?.coproprietaire

    if (coproprietaire?.email) {
      const montantFormate = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(appel.montant ?? 0)

      const dateEcheance = appel.date_echeance
        ? new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(new Date(appel.date_echeance))
        : '—'

      await Email.relanceImpayes(
        {
          prenom: coproprietaire.prenom,
          nom: coproprietaire.nom,
          montant: montantFormate,
          dateEcheance,
          cabinetNom,
          nomCopropriete: lot?.copropriete?.nom ?? '',
          numeroLot: lot?.numero ?? '',
          niveau,
        },
        coproprietaire.email
      ).catch(err => captureException(err, { context: 'appels-relancer-email' }))
    }

    return NextResponse.json({ success: true, niveau })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
})
