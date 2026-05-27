'use client'

/**
 * Page de callback auth — flow implicite Supabase
 *
 * Supabase redirige ici après validation d'un lien email
 * (confirmation d'inscription, invitation gestionnaire, magic link…)
 * avec les tokens dans le hash : #access_token=...&refresh_token=...&type=signup
 *
 * Le client Supabase SSR (@supabase/ssr) détecte automatiquement ce hash
 * via onAuthStateChange. On attend la session, puis on redirige.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Le client SSR traite automatiquement le hash #access_token au montage.
    // On écoute l'événement pour agir dès que la session est établie.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Récupérer le profil pour savoir si l'onboarding est fait
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_complete, role')
            .eq('id', session.user.id)
            .single()

          if (profile?.role === 'owner_resident') {
            router.replace('/accueil')
          } else if (!profile?.onboarding_complete) {
            router.replace('/onboarding')
          } else {
            router.replace('/dashboard')
          }
        }
      }
    )

    // Fallback : si la session est déjà établie (rafraîchissement de page)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_complete, role')
          .eq('id', session.user.id)
          .single()

        if (profile?.role === 'owner_resident') {
          router.replace('/accueil')
        } else if (!profile?.onboarding_complete) {
          router.replace('/onboarding')
        } else {
          router.replace('/dashboard')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800" />
        <p className="text-sm text-gray-500">Connexion en cours…</p>
      </div>
    </div>
  )
}
