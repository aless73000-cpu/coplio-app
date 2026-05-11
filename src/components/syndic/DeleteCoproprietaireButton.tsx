'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

export function DeleteCoproprietaireButton({ id, nom }: { id: string; nom: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/coproprietaires/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/coproprietaires')
      router.refresh()
    } else {
      setDeleting(false)
      setConfirming(false)
      alert('Erreur lors de la suppression.')
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Supprimer {nom} ?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 bg-red-500 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Confirmer
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-sm text-muted-foreground px-3 py-2 rounded-lg hover:bg-coplio-bg transition-colors"
        >
          Annuler
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-2 border border-red-200 text-red-500 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
      Supprimer
    </button>
  )
}
