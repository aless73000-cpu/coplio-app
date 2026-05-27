'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, X } from 'lucide-react'

export function StickyBanner() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (dismissed || !visible) return null

  return (
    <div
      className="fixed top-[66px] inset-x-0 z-40 flex items-center justify-center gap-4 px-4 py-2.5 border-b border-white/[0.08]"
      style={{
        background: '#08090A',
        animation: 'slideDown 0.3s cubic-bezier(0.25,0.46,0.45,0.94) both',
      }}
    >
      <p className="text-sm hidden sm:block" style={{ color: 'rgba(255,255,255,0.45)' }}>
        14 jours d&apos;essai gratuit · Sans carte bancaire · Sans engagement
      </p>
      <Link
        href="/register"
        className="flex items-center gap-1.5 bg-white text-[#08090A] text-xs font-bold px-4 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
        style={{ letterSpacing: '-0.01em' }}
      >
        Essayer gratuitement <ArrowRight className="w-3 h-3" />
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-4 transition-colors"
        style={{ color: 'rgba(255,255,255,0.25)' }}
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
