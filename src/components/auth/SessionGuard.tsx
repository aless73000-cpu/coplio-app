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
      supabase.auth.signOut().then(() => {
        router.replace(loginPath)
      })
    }
  }, [loginPath, router])

  return null
}
