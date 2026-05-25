'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubscribeButtonProps {
  plan: string
  isPro?: boolean
}

export function SubscribeButton({ plan, isPro }: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch (err) {
      console.error(err)
      alert('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className={cn(
        'w-full py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60',
        isPro
          ? 'bg-[#374151] text-white hover:bg-[#374151]/90'
          : 'bg-coplio-bg text-coplio-text border border-border hover:border-[#374151]/30 hover:bg-slate-100'
      )}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Chargement...
        </span>
      ) : (
        'Choisir ce plan'
      )}
    </button>
  )
}
