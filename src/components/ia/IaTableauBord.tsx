'use client'

import { useState, useEffect } from 'react'
import { BarChart2, Sparkles, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

interface RiskScore {
  copropriete_id: string
  nom: string
  score: number
  niveau: string
  tauxImpaye: number
  montantImpayes: number
  sinistresOuverts: number
}

interface Anomalie {
  titre: string
  description: string
  severite: 'haute' | 'moyenne' | 'faible'
  copropriete?: string
}

interface AnalyseCabinet {
  scores: RiskScore[]
  analyse: {
    anomalies: Anomalie[]
    recommandations: string[]
    points_positifs: string[]
    resume: string
  }
}

export function IaTableauBord() {
  const [analyseData,   setAnalyseData]   = useState<AnalyseCabinet | null>(null)
  const [analyseLoading, setAnalyseLoading] = useState(false)
  const [analyseLoaded,  setAnalyseLoaded]  = useState(false)

  useEffect(() => {
    if (!analyseLoaded) loadAnalyse()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadAnalyse() {
    setAnalyseLoading(true)
    try {
      const res = await fetch('/api/ia/analyse-cabinet')
      const data = await res.json()
      setAnalyseData(data)
      setAnalyseLoaded(true)
    } catch {
      setAnalyseData(null)
    } finally {
      setAnalyseLoading(false)
    }
  }

  if (analyseLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#111827]" />
        <p className="text-sm text-muted-foreground">L&apos;IA analyse votre portefeuille...</p>
      </div>
    )
  }

  if (!analyseData) {
    return (
      <div className="coplio-card text-center py-12">
        <BarChart2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
        <button
          onClick={loadAnalyse}
          className="bg-[#111827] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#111827]/90 transition-colors"
        >
          Lancer l&apos;analyse
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Résumé */}
      {analyseData.analyse.resume && (
        <div className="coplio-card bg-slate-100 border-[#111827]/20">
          <p className="text-sm text-coplio-text font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#111827]" />
            {analyseData.analyse.resume}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scores de risque */}
        <div className="coplio-card">
          <h2 className="font-semibold text-coplio-text mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[#111827]" />Score de risque par copropriété
          </h2>
          <div className="space-y-3">
            {(analyseData.scores ?? []).map(s => (
              <div key={s.copropriete_id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-coplio-text font-medium truncate max-w-[160px]">{s.nom}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      s.niveau === 'critique' ? 'bg-red-50 text-red-600'
                      : s.niveau === 'élevé'  ? 'bg-orange-50 text-orange-600'
                      : s.niveau === 'moyen'  ? 'bg-amber-50 text-amber-600'
                      : 'bg-slate-100 text-[#111827]'
                    }`}>
                      {s.niveau}
                    </span>
                    <span className="text-sm font-bold text-coplio-text w-8 text-right">{s.score}</span>
                  </div>
                </div>
                <div className="h-2 bg-coplio-bg rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      s.score >= 80 ? 'bg-[#111827]'
                      : s.score >= 60 ? 'bg-amber-400'
                      : s.score >= 40 ? 'bg-orange-400'
                      : 'bg-red-500'
                    }`}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.tauxImpaye}% impayés · {s.sinistresOuverts} sinistre{s.sinistresOuverts > 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setAnalyseLoaded(false); loadAnalyse() }}
            className="mt-4 text-xs text-[#111827] hover:underline"
          >
            Rafraîchir l&apos;analyse
          </button>
        </div>

        {/* Anomalies + Recommandations + Points positifs */}
        <div className="space-y-4">
          <div className="coplio-card">
            <h2 className="font-semibold text-coplio-text mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-coplio-amber" />Anomalies détectées
            </h2>
            {(analyseData.analyse.anomalies ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune anomalie détectée</p>
            ) : (
              <div className="space-y-2">
                {analyseData.analyse.anomalies.map((a, i) => (
                  <div key={i} className={`p-3 rounded-xl border text-sm ${
                    a.severite === 'haute'   ? 'bg-red-50 border-red-200'
                    : a.severite === 'moyenne' ? 'bg-amber-50 border-amber-200'
                    : 'bg-coplio-bg border-border'
                  }`}>
                    <p className="font-medium text-coplio-text">{a.titre}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                    {a.copropriete && (
                      <span className="text-xs font-medium text-[#111827] mt-1 block">{a.copropriete}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="coplio-card">
            <h2 className="font-semibold text-coplio-text mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#111827]" />Recommandations
            </h2>
            <ul className="space-y-2">
              {(analyseData.analyse.recommandations ?? []).map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-coplio-text">
                  <span className="text-[#111827] font-bold flex-shrink-0 mt-0.5">→</span>{r}
                </li>
              ))}
            </ul>
          </div>

          {(analyseData.analyse.points_positifs ?? []).length > 0 && (
            <div className="coplio-card">
              <h2 className="font-semibold text-coplio-text mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#111827]" />Points positifs
              </h2>
              <ul className="space-y-2">
                {analyseData.analyse.points_positifs.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-coplio-text">
                    <span className="text-[#111827] flex-shrink-0 mt-0.5">✓</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
