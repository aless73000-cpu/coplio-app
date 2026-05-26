'use client'

import { useFormStatus } from 'react-dom'
import { Send, Loader2 } from 'lucide-react'

export function SinistreSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 bg-[#374151] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#374151]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Envoi en cours...
        </>
      ) : (
        <>
          <Send className="w-4 h-4" />
          Envoyer au syndic
        </>
      )}
    </button>
  )
}
