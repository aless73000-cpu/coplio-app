'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X } from 'lucide-react'

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

export function OnboardingChecklist({ steps }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const doneCount = steps.filter((s) => s.done).length
  const allDone = doneCount === steps.length
  const progress = Math.round((doneCount / steps.length) * 100)

  if (dismissed || allDone) return null

  return (
    <div className="coplio-card border-coplio-green/30 bg-gradient-to-br from-white to-coplio-green-light/30 mb-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-coplio-text text-sm">Démarrez avec Coplio</h2>
              <span className="text-xs font-medium text-coplio-green bg-coplio-green-light px-2 py-0.5 rounded-full">
                {doneCount}/{steps.length}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-40 h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-coplio-green rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg hover:bg-coplio-bg transition-colors text-muted-foreground"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg hover:bg-coplio-bg transition-colors text-muted-foreground"
            title="Masquer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-1.5">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${
                step.done ? 'opacity-60' : 'hover:bg-white/60'
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="w-5 h-5 text-coplio-green flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-border flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.done ? 'line-through text-muted-foreground' : 'text-coplio-text'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              </div>
              {!step.done && (
                <Link
                  href={step.href}
                  className="text-xs font-medium text-coplio-green hover:text-coplio-green/80 flex-shrink-0 mt-0.5"
                >
                  Faire →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
