'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'

/**
 * Détecte un conflit de session (portail↔syndic) via le paramètre ?conflict=
 * et affiche un toast explicatif, puis nettoie l'URL.
 */
export function ConflictBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const conflict = searchParams.get('conflict')

  useEffect(() => {
    if (!conflict) return

    if (conflict === 'portail') {
      toast.warning('Espace copropriétaire détecté', {
        description:
          'Votre session copropriétaire a été reconnue. Vous avez été redirigé vers votre espace syndic.',
        duration: 6000,
      })
    } else if (conflict === 'syndic') {
      toast.warning('Espace syndic détecté', {
        description:
          'Votre session syndic a été reconnue. Vous avez été redirigé vers votre espace copropriétaire.',
        duration: 6000,
      })
    }

    // Nettoyer le paramètre de l'URL sans recharger la page
    const params = new URLSearchParams(searchParams.toString())
    params.delete('conflict')
    const newUrl = params.toString() ? `${pathname}?${params}` : pathname
    router.replace(newUrl)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conflict])

  return null
}
