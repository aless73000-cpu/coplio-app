'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  text: string
  className?: string
}

export function CopyButton({ text, className }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback pour navigateurs sans clipboard API
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copié !' : 'Copier'}
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all flex-shrink-0 ${
        copied
          ? 'bg-[#374151] text-white'
          : 'bg-coplio-bg hover:bg-slate-100 text-muted-foreground hover:text-[#374151]'
      } ${className ?? ''}`}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" />
          Copié
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          Copier
        </>
      )}
    </button>
  )
}
