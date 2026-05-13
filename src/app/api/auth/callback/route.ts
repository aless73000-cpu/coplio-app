import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const meta = user.user_metadata as {
          role?: string
          coproprietaire_id?: string
          cabinet_id?: string
          lot_id?: string
          prenom?: string
          nom?: string
        }

        // Gestionnaire qui accepte une invitation
        if (meta?.role === 'manager' && meta?.cabinet_id) {
          const admin = createAdminClient()
          await admin
            .from('profiles')
            .update({
              cabinet_id: meta.cabinet_id,
              role: 'manager',
              prenom: meta.prenom ?? null,
              nom: meta.nom ?? null,
              onboarding_complete: true,
            })
            .eq('id', user.id)
          return NextResponse.redirect(`${origin}/dashboard`)
        }

        // Copropriétaire qui accepte une invitation
        if (meta?.role === 'owner_resident' && meta?.coproprietaire_id) {
          const admin = createAdminClient()

          // Compléter le profil (le trigger a créé le profil avec role + email)
          await admin
            .from('profiles')
            .update({
              cabinet_id: meta.cabinet_id ?? null,
              lot_id: meta.lot_id ?? null,
              prenom: meta.prenom ?? null,
              nom: meta.nom ?? null,
              onboarding_complete: true,
            })
            .eq('id', user.id)

          // Lier le profil au copropriétaire + activer le portail
          await admin
            .from('coproprietaires')
            .update({
              profile_id: user.id,
              portail_actif: true,
            })
            .eq('id', meta.coproprietaire_id)

          return NextResponse.redirect(`${origin}/accueil`)
        }

        // Connexion classique — rediriger selon le rôle
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'owner_resident') {
          return NextResponse.redirect(`${origin}/accueil`)
        }

        // Filet de sécurité : si next=/accueil, chercher un copropriétaire lié à cet email
        // (cas où les métadonnées du magiclink n'ont pas été transmises)
        if (next === '/accueil' && user.email) {
          const admin = createAdminClient()
          const { data: copro } = await admin
            .from('coproprietaires')
            .select('id, cabinet_id, prenom, nom')
            .eq('email', user.email)
            .limit(1)
            .single()

          if (copro) {
            // Récupérer le lot du copropriétaire
            const { data: junctions } = await admin
              .from('coproprietaire_lots')
              .select('lot_id')
              .eq('coproprietaire_id', copro.id)
              .limit(1)
            const lotId = junctions?.[0]?.lot_id ?? null

            await admin
              .from('profiles')
              .update({
                cabinet_id: copro.cabinet_id ?? null,
                lot_id: lotId,
                prenom: copro.prenom ?? null,
                nom: copro.nom ?? null,
                role: 'owner_resident',
                onboarding_complete: true,
              })
              .eq('id', user.id)

            await admin
              .from('coproprietaires')
              .update({ profile_id: user.id, portail_actif: true })
              .eq('id', copro.id)

            return NextResponse.redirect(`${origin}/accueil`)
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
