'use client'

import { useState } from 'react'
import { CheckCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function MarkAllReadButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function markAllRead() {
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ lu: true, lu_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('lu', false)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={markAllRead}
      disabled={loading}
      className="flex items-center gap-2 text-sm font-medium text-[#111827] hover:text-[#111827]/80 bg-slate-100 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
    >
      <CheckCheck className="w-4 h-4" />
      {loading ? 'En cours...' : 'Tout marquer lu'}
    </button>
  )
}
