'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Building2, Loader2, CheckCircle2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { Cabinet } from '@/types'
import { Field } from './Field'

type Props = {
  cabinet?: Cabinet | null
}

export function CabinetSection({ cabinet }: Props) {
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [cabinetData, setCabinetData] = useState({
    nom: cabinet?.nom ?? '',
    siret: cabinet?.siret ?? '',
    telephone: cabinet?.telephone ?? '',
    adresse: cabinet?.adresse ?? '',
    code_postal: cabinet?.code_postal ?? '',
    ville: cabinet?.ville ?? '',
    email_contact: cabinet?.email_contact ?? '',
  })

  const [cabinetStatus, setCabinetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [cabinetError, setCabinetError] = useState('')
  const [logoUrl, setLogoUrl] = useState(cabinet?.logo_url ?? '')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState('')

  async function uploadLogo(file: File) {
    setLogoUploading(true)
    setLogoError('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/cabinet/logo', { method: 'POST', body: fd })
    const data = await res.json()
    setLogoUploading(false)
    if (!res.ok) {
      setLogoError(data.error ?? 'Erreur upload')
      toast.error(data.error ?? 'Erreur upload du logo')
      return
    }
    setLogoUrl(data.logo_url)
    toast.success('Logo mis à jour')
  }

  async function saveCabinet() {
    setCabinetStatus('loading')
    setCabinetError('')
    try {
      const res = await fetch('/api/cabinet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cabinetData),
      })
      const data = await res.json()
      if (!res.ok) {
        setCabinetError(data.error ?? 'Erreur')
        setCabinetStatus('error')
        toast.error(data.error ?? 'Erreur lors de la sauvegarde')
        return
      }
      setCabinetStatus('success')
      toast.success('Cabinet enregistré')
      setTimeout(() => setCabinetStatus('idle'), 3000)
    } catch {
      setCabinetError('Erreur réseau')
      setCabinetStatus('error')
      toast.error('Erreur réseau')
    }
  }

  return (
    <section className="coplio-card">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
          <Building2 className="w-4 h-4 text-[#374151]" />
        </div>
        <h2 className="font-semibold text-coplio-text">Mon cabinet</h2>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
        <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-coplio-bg overflow-hidden flex-shrink-0">
          {logoUrl ? (
            <Image src={logoUrl} alt="Logo cabinet" width={64} height={64} className="object-contain w-full h-full" />
          ) : (
            <Building2 className="w-7 h-7 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-coplio-text mb-1">Logo du cabinet</p>
          <p className="text-xs text-muted-foreground mb-2">JPG, PNG, WebP ou SVG · max 2 Mo</p>
          <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml"
            className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }} />
          <button onClick={() => logoInputRef.current?.click()} disabled={logoUploading}
            className="flex items-center gap-1.5 text-xs font-medium text-[#374151] border border-[#374151]/40 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-60">
            {logoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {logoUploading ? 'Upload en cours...' : 'Changer le logo'}
          </button>
          {logoError && <p className="text-xs text-coplio-red mt-1">{logoError}</p>}
          {logoUrl && !logoUploading && (
            <p className="text-xs text-[#374151] mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Logo enregistré
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Nom du cabinet" value={cabinetData.nom} onChange={(v) => setCabinetData((d) => ({ ...d, nom: v }))} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="SIRET" value={cabinetData.siret} onChange={(v) => setCabinetData((d) => ({ ...d, siret: v }))} />
          <Field label="Téléphone" value={cabinetData.telephone} type="tel" onChange={(v) => setCabinetData((d) => ({ ...d, telephone: v }))} />
        </div>
        <Field label="Adresse" value={cabinetData.adresse} onChange={(v) => setCabinetData((d) => ({ ...d, adresse: v }))} />
        <div className="grid grid-cols-3 gap-4">
          <Field label="Code postal" value={cabinetData.code_postal} onChange={(v) => setCabinetData((d) => ({ ...d, code_postal: v }))} />
          <div className="col-span-2">
            <Field label="Ville" value={cabinetData.ville} onChange={(v) => setCabinetData((d) => ({ ...d, ville: v }))} />
          </div>
        </div>
        <Field label="Email de contact" value={cabinetData.email_contact} type="email" onChange={(v) => setCabinetData((d) => ({ ...d, email_contact: v }))} />
      </div>

      {cabinetError && <p className="mt-3 text-sm text-coplio-red">{cabinetError}</p>}
      <button onClick={saveCabinet} disabled={cabinetStatus === 'loading'}
        className="mt-5 flex items-center gap-2 bg-[#374151] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#374151]/90 transition-colors disabled:opacity-60">
        {cabinetStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
        {cabinetStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
        {cabinetStatus === 'success' ? 'Enregistré !' : 'Enregistrer'}
      </button>
    </section>
  )
}
