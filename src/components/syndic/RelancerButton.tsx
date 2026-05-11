'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function RelancerButton({ appelId }: { appelId: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleRelancer() {
    setLoading(true)
    await fetch(`/api/appels-charges/${appelId}/relancer`, { method: 'POST' })
    setLoading(false)
    setDone(true)
    router.refresh()
    setTimeout(() => setDone(false), 3000)
  }

  return (
    <button
      onClick={handleRelancer}
      disabled={loading || done}
      className="flex items-center gap-1 text-xs text-coplio-amber font-medium hover:text-coplio-amber/80 transition-colors disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
      {done ? 'Envoyée' : 'Relancer'}
    </button>
  )
}

export function RelancerTousButton({ appelIds }: { appelIds: string[] }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleRelancerTous() {
    setLoading(true)
    await Promise.all(
      appelIds.map((id) => fetch(`/api/appels-charges/${id}/relancer`, { method: 'POST' }))
    )
    setLoading(false)
    setDone(true)
    router.refresh()
    setTimeout(() => setDone(false), 3000)
  }

  return (
    <button
      onClick={handleRelancerTous}
      disabled={loading || done || appelIds.length === 0}
      className="flex items-center gap-2 px-3 py-1.5 bg-coplio-amber text-white rounded-lg text-xs font-medium hover:bg-coplio-amber/90 transition-colors disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
      {done ? 'Envoyées !' : 'Relancer tous'}
    </button>
  )
}
