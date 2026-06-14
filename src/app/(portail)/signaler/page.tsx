'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Camera, AlertTriangle, CheckCircle2, Loader2,
  MapPin, X, ImagePlus, Zap,
} from 'lucide-react'

const ZONES = [
  { id: 'hall',            label: 'Hall d\'entrée',      emoji: '🚪' },
  { id: 'escaliers',       label: 'Escaliers',           emoji: '🪜' },
  { id: 'palier',          label: 'Palier',              emoji: '🚶' },
  { id: 'cave',            label: 'Cave / Sous-sol',     emoji: '🏚️' },
  { id: 'toiture',         label: 'Toiture / Terrasse',  emoji: '🏠' },
  { id: 'facade',          label: 'Façade',              emoji: '🧱' },
  { id: 'parking',         label: 'Parking',             emoji: '🅿️' },
  { id: 'parties_communes',label: 'Parties communes',    emoji: '🏢' },
  { id: 'autre',           label: 'Autre',               emoji: '📍' },
]

const URGENCES = [
  { id: 'normal',  label: 'Pas urgent',    description: 'À traiter dans les prochains jours',  color: 'slate' },
  { id: 'urgent',  label: 'Urgent',        description: 'Nécessite une intervention rapide',    color: 'amber' },
  { id: 'urgence', label: 'Très urgent',   description: 'Danger ou dommages imminents',         color: 'red'   },
]

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function SignalerPage() {
  const fileRef = useRef<HTMLInputElement>(null)

  const [zone, setZone]               = useState('')
  const [urgence, setUrgence]         = useState('normal')
  const [description, setDescription] = useState('')
  const [photo, setPhoto]             = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [status, setStatus]           = useState<Status>('idle')
  const [errorMsg, setErrorMsg]       = useState('')
  const [createdRef, setCreatedRef]   = useState('')

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function removePhoto() {
    setPhoto(null)
    setPhotoPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!zone) { setErrorMsg('Sélectionnez la zone concernée'); return }
    if (description.length < 10) { setErrorMsg('Description trop courte (10 caractères minimum)'); return }

    setStatus('submitting')
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('zone', zone)
      formData.append('urgence', urgence)
      formData.append('description', description)
      if (photo) formData.append('photo', photo)

      const res = await fetch('/api/portail/signalement', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Erreur lors de l\'envoi')
        setStatus('error')
        return
      }

      setCreatedRef(data.reference)
      setStatus('success')
    } catch {
      setErrorMsg('Erreur réseau — vérifiez votre connexion')
      setStatus('error')
    }
  }

  // ── Success screen ────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="max-w-lg mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Signalement envoyé !</h2>
          <p className="text-sm text-slate-500 mb-1">Votre syndic a été notifié immédiatement.</p>
          {createdRef && (
            <p className="text-xs text-slate-400 mb-6">Référence : <span className="font-mono font-semibold text-slate-600">{createdRef}</span></p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => { setStatus('idle'); setZone(''); setDescription(''); setPhoto(null); setPhotoPreview(null) }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Nouveau signalement
            </button>
            <Link
              href="/accueil"
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-4 px-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/accueil" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ letterSpacing: '-0.02em' }}>Signaler un problème</h1>
          <p className="text-sm text-slate-400 mt-0.5">Votre syndic sera notifié immédiatement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Zone */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            Où se situe le problème ? *
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ZONES.map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => setZone(z.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                  zone === z.id
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span className="text-lg">{z.emoji}</span>
                <span className="text-[11px] font-medium leading-tight">{z.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Urgence */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-slate-400" />
            Niveau d&apos;urgence
          </p>
          <div className="space-y-2">
            {URGENCES.map((u) => (
              <label key={u.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="urgence"
                  value={u.id}
                  checked={urgence === u.id}
                  onChange={() => setUrgence(u.id)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  urgence === u.id
                    ? u.color === 'red'   ? 'border-red-500 bg-red-500'
                    : u.color === 'amber' ? 'border-amber-500 bg-amber-500'
                    :                       'border-slate-700 bg-slate-700'
                    : 'border-slate-300'
                }`}>
                  {urgence === u.id && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${
                    urgence === u.id
                      ? u.color === 'red'   ? 'text-red-700'
                      : u.color === 'amber' ? 'text-amber-700'
                      :                       'text-slate-900'
                      : 'text-slate-700'
                  }`}>{u.label}</p>
                  <p className="text-xs text-slate-400">{u.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            Description du problème *
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Décrivez le problème en quelques phrases : nature du problème, depuis quand, impacts éventuels…"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900/40 resize-none placeholder:text-slate-400 transition-all"
          />
          <p className={`text-xs mt-1 text-right ${description.length < 10 && description.length > 0 ? 'text-red-500' : 'text-slate-400'}`}>
            {description.length} / 500
          </p>
        </div>

        {/* Photo */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4 text-slate-400" />
            Photo <span className="text-slate-400 font-normal">(optionnel)</span>
          </p>

          {photoPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Aperçu" className="w-full h-48 object-cover rounded-xl" />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center gap-3 py-8 border-2 border-dashed border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-600"
            >
              <ImagePlus className="w-8 h-8" />
              <div className="text-center">
                <p className="text-sm font-medium">Ajouter une photo</p>
                <p className="text-xs mt-0.5">JPG, PNG, WEBP — max 10 Mo</p>
              </div>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        {/* Error */}
        {(status === 'error' || errorMsg) && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={status === 'submitting' || !zone || description.length < 10}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-2xl text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {status === 'submitting'
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</>
            : <><AlertTriangle className="w-4 h-4" /> Envoyer le signalement</>
          }
        </button>

        <p className="text-center text-xs text-slate-400">
          Votre syndic sera notifié par email et sur l&apos;application
        </p>
      </form>
    </div>
  )
}
