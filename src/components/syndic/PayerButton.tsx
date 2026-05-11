'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function PayerButton({ appelId }: { appelId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handlePayer() {
    if (!confirm('Marquer cet appel de charges comme payé ?')) return
    setLoading(true)
    await fetch(`/api/appels-charges/${appelId}/payer`, { method: 'PATCH' })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handlePayer}
      disabled={loading}
      className="flex items-center gap-1 text-xs text-coplio-green font-medium hover:text-coplio-green/80 transition-colors disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
      Marquer payé
    </button>
  )
}
