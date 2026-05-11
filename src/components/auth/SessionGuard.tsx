'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SessionGuardProps {
  loginPath: string
}

export function SessionGuard({ loginPath }: SessionGuardProps) {
  const router = useRouter()

  useEffect(() => {
    const hasPersist = localStorage.getItem('coplio_persist') === '1'
    const hasSession = sessionStorage.getItem('coplio_session') === '1'

    if (!hasPersist && !hasSession) {
      const supabase = createClient()
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          // Pas de session du tout → rediriger vers login
          router.replace(loginPath)
        } else {
          // Session valide mais pas de flag → récupération gracieuse
          sessionStorage.setItem('coplio_session', '1')
        }
      })
    }
  }, [loginPath, router])

  return null
}
