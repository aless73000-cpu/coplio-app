'use client'

import { CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ConfirmButton } from '@/components/ui/ConfirmButton'

export function PayerButton({ appelId }: { appelId: string }) {
  const router = useRouter()

  return (
    <ConfirmButton
      label={<><CheckCircle2 className="w-3.5 h-3.5" />Marquer payé</>}
      message="Marquer comme payé ?"
      confirmLabel="Oui, payé"
      className="flex items-center gap-1 text-xs text-[#374151] font-medium hover:text-[#374151]/80 transition-colors"
      onConfirm={async () => {
        await fetch(`/api/appels-charges/${appelId}/payer`, { method: 'PATCH' })
        router.refresh()
      }}
    />
  )
}
