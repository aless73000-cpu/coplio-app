'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

interface Props {
  /** compact = icône seule (sidebar/header), 'full' = bouton avec label */
  variant?: 'icon' | 'full'
  className?: string
}

export function ThemeToggle({ variant = 'icon', className = '' }: Props) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Évite le flash SSR
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const isDark = resolvedTheme === 'dark'

  function toggle() {
    setTheme(isDark ? 'light' : 'dark')
  }

  if (variant === 'full') {
    return (
      <button
        onClick={toggle}
        aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 ${className}`}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        <span>{isDark ? 'Mode clair' : 'Mode sombre'}</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
        hover:bg-slate-100 dark:hover:bg-white/10
        text-slate-500 dark:text-slate-400 ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
