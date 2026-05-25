'use client'

import { useState, useEffect } from 'react'
import { Sparkles, FileText, FileSearch, MessageCircle, BarChart2 } from 'lucide-react'
import { IaRedaction }    from '@/components/ia/IaRedaction'
import { IaAnalyse }      from '@/components/ia/IaAnalyse'
import { IaChat }         from '@/components/ia/IaChat'
import { IaTableauBord }  from '@/components/ia/IaTableauBord'
import { useApi }         from '@/hooks/useApi'

interface Copropriete { id: string; nom: string }

const TABS = [
  { key: 'rediger',  label: 'Rédaction assistée',   icon: FileText    },
  { key: 'analyser', label: 'Analyse de documents',  icon: FileSearch  },
  { key: 'chat',     label: 'Chat IA',               icon: MessageCircle },
  { key: 'tableau',  label: 'Tableau de bord IA',    icon: BarChart2   },
] as const

type TabKey = typeof TABS[number]['key']

export default function IAPage() {
  const [tab,           setTab]           = useState<TabKey>('rediger')
  const [coproprieteId, setCoproprieteId] = useState('')

  const { data: copropietesData } = useApi<Copropriete[]>('/api/coproprietes')
  const coproprietes = copropietesData ?? []

  // Set default copropriete once data loads
  useEffect(() => {
    if (coproprietes.length > 0 && !coproprieteId) {
      setCoproprieteId(coproprietes[0].id)
    }
  }, [coproprietes, coproprieteId])

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#374151]" />Assistant IA
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Rédaction, analyse, chat et détection d&apos;anomalies
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-coplio-bg p-1 rounded-xl flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-coplio-text shadow-sm'
                : 'text-muted-foreground hover:text-coplio-text'
            }`}
          >
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'rediger'  && (
        <IaRedaction
          coproprietes={coproprietes}
          coproprieteId={coproprieteId}
          onCoproprieteChange={setCoproprieteId}
        />
      )}
      {tab === 'analyser' && <IaAnalyse />}
      {tab === 'chat'     && (
        <IaChat
          coproprietes={coproprietes}
          coproprieteId={coproprieteId}
          onCoproprieteChange={setCoproprieteId}
        />
      )}
      {tab === 'tableau'  && <IaTableauBord />}
    </div>
  )
}
