'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Trash2, Loader2 } from 'lucide-react'

interface Props {
  ecritureId: string
  coproprieteId: string
  equilibre: boolean
}

export function EcritureActions({ ecritureId, coproprieteId, equilibre }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function valider() {
    setLoading('valider')
    const supabase = createClient()
    await supabase
      .from('ecritures_comptables')
      .update({ statut: 'valide' })
      .eq('id', ecritureId)
    router.refresh()
    setLoading(null)
  }

  async function supprimer() {
    setLoading('supprimer')
    const supabase = createClient()
    await supabase.from('ecritures_comptables').delete().eq('id', ecritureId)
    router.push(`/comptabilite/ecritures?copropriete=${coproprieteId}`)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={valider}
        disabled={!equilibre || !!loading}
        title={!equilibre ? 'Équilibrez d\'abord l\'écriture' : ''}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-colors"
      >
        {loading === 'valider'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <CheckCircle2 className="w-3.5 h-3.5" />
        }
        Valider
      </button>

      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
          <span className="text-xs text-red-700 font-medium">Supprimer ?</span>
          <button
            onClick={supprimer}
            disabled={loading === 'supprimer'}
            className="text-xs font-semibold text-red-700 hover:text-red-900"
          >
            {loading === 'supprimer' ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Oui'}
          </button>
          <button onClick={() => setConfirmDelete(false)} className="text-xs text-muted-foreground hover:text-coplio-text">
            Non
          </button>
        </div>
      )}
    </div>
  )
}
