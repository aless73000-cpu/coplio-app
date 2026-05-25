'use client'

import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

export function AddonPortailButton() {
  const [loading, setLoading] = useState(false)

  async function handleActivate() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/addon-portail', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch (err) {
      console.error(err)
      alert('Une erreur est survenue. Veuillez réessayer ou contacter contact@coplio.fr.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleActivate}
      disabled={loading}
      className="flex items-center gap-2 bg-[#111827] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#111827]/90 transition-colors disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      Activer l&apos;add-on
    </button>
  )
}
