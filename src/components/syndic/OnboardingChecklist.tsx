'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, Sparkles } from 'lucide-react'

interface Step {
  id: string
  label: string
  description: string
  href: string
  done: boolean
}

interface Props {
  steps: Step[]
}

const STORAGE_KEY = 'coplio_onboarding_dismissed'
const STORAGE_COLLAPSED = 'coplio_onboarding_collapsed'

export function OnboardingChecklist({ steps }: Props) {
  // Initialise depuis localStorage (côté client uniquement)
  const [dismissed, setDismissed] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDismissed(localStorage.getItem(STORAGE_KEY) === '1')
    setCollapsed(localStorage.getItem(STORAGE_COLLAPSED) === '1')
  }, [])

  const doneCount = steps.filter((s) => s.done).length
  const allDone = doneCount === steps.length
  const progress = Math.round((doneCount / steps.length) * 100)

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setDismissed(true)
  }

  function handleCollapse() {
    const next = !collapsed
    localStorage.setItem(STORAGE_COLLAPSED, next ? '1' : '0')
    setCollapsed(next)
  }

  // Évite le flash SSR/CSR
  if (!mounted) return null
  if (dismissed || allDone) return null

  // Prochain step à faire (pour highlight)
  const nextStepId = steps.find((s) => !s.done)?.id

  return (
    <div className="coplio-card border-[#374151]/30 bg-gradient-to-br from-white to-slate-100/30 mb-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-[#374151]/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-[#374151]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-coplio-text text-sm">Démarrez avec Coplio</h2>
              <span className="text-xs font-medium text-[#374151] bg-slate-100 px-2 py-0.5 rounded-full">
                {doneCount}/{steps.length}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-40 h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#374151] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCollapse}
            className="p-1.5 rounded-lg hover:bg-coplio-bg transition-colors text-muted-foreground"
            title={collapsed ? 'Développer' : 'Réduire'}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-coplio-bg transition-colors text-muted-foreground"
            title="Masquer définitivement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-1.5">
          {steps.map((step) => {
            const isNext = step.id === nextStepId
            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${
                  step.done
                    ? 'opacity-50'
                    : isNext
                    ? 'bg-white border border-[#374151]/20 shadow-sm'
                    : 'hover:bg-white/60'
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="w-5 h-5 text-[#374151] flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isNext ? 'text-[#374151]' : 'text-border'}`} />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${step.done ? 'line-through text-muted-foreground' : 'text-coplio-text'}`}>
                    {step.label}
                    {isNext && (
                      <span className="ml-2 text-[10px] font-semibold text-[#374151] bg-slate-100 px-1.5 py-0.5 rounded-full">
                        À faire
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
                {!step.done && (
                  <Link
                    href={step.href}
                    className={`text-xs font-semibold flex-shrink-0 mt-0.5 transition-colors ${
                      isNext
                        ? 'text-white bg-[#374151] px-2.5 py-1 rounded-lg hover:bg-[#374151]/90'
                        : 'text-[#374151] hover:text-[#374151]/80'
                    }`}
                  >
                    {isNext ? 'Commencer →' : 'Faire →'}
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
