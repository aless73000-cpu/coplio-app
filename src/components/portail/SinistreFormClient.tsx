'use client'

import { useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useLocalDraft } from '@/hooks/useLocalDraft'
import { SinistreSubmitButton } from './SinistreSubmitButton'

const TYPE_OPTIONS = [
  { value: 'degat_eaux',     label: 'Dégât des eaux' },
  { value: 'infiltration',   label: 'Infiltration / humidité' },
  { value: 'electricite',    label: 'Problème électrique' },
  { value: 'ascenseur',      label: 'Ascenseur en panne' },
  { value: 'parties_communes', label: 'Parties communes' },
  { value: 'nuisance',       label: 'Nuisance / trouble du voisinage' },
  { value: 'securite',       label: 'Sécurité (serrure, porte...)' },
  { value: 'autre',          label: 'Autre problème' },
]

const DRAFT_KEY = 'coplio:sinistre-form-draft'
const INITIAL_DRAFT = { type: '', titre: '', description: '' }

interface Props {
  action: (formData: FormData) => Promise<void>
}

export function SinistreFormClient({ action }: Props) {
  const { draft, setField, clearDraft } = useLocalDraft(DRAFT_KEY, INITIAL_DRAFT)
  const formRef = useRef<HTMLFormElement>(null)

  // Nettoyer le draft juste avant la soumission
  function handleSubmit() {
    clearDraft()
  }

  const hasDraft = draft.titre || draft.description

  return (
    <form
      ref={formRef}
      action={action}
      method="POST"
      encType="multipart/form-data"
      onSubmit={handleSubmit}
    >
      {hasDraft && (
        <div className="mb-4 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200">
          <span className="text-xs text-blue-700">Brouillon restauré</span>
          <button
            type="button"
            onClick={clearDraft}
            className="text-xs text-blue-500 underline underline-offset-2 hover:text-blue-700"
          >
            Effacer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-coplio-text mb-1.5">
            Type de problème <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            required
            value={draft.type}
            onChange={e => setField('type', e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-transparent"
          >
            <option value="">Sélectionnez...</option>
            {TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-coplio-text mb-1.5">
            Titre court <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="titre"
            required
            value={draft.titre}
            onChange={e => setField('titre', e.target.value)}
            placeholder="Ex : Fuite sous l'évier de la cuisine"
            className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-transparent"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-coplio-text mb-1.5">
          Description détaillée <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          required
          rows={4}
          value={draft.description}
          onChange={e => setField('description', e.target.value)}
          placeholder="Décrivez le problème : depuis quand, localisation précise, impact sur votre logement..."
          className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-transparent resize-none"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-coplio-text mb-1.5">
          Photos{' '}
          <span className="text-xs text-muted-foreground font-normal">
            (facultatif · max 5 photos · JPG, PNG, HEIC)
          </span>
        </label>
        <input
          type="file"
          name="photos"
          multiple
          accept="image/*,.heic,.heif"
          className="w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-[#374151] hover:file:bg-[#374151]/20 transition-colors cursor-pointer"
        />
      </div>

      <div className="flex items-center gap-3 mb-5 p-3 bg-coplio-red-bg rounded-xl border border-coplio-red/20">
        <input
          type="checkbox"
          id="urgence"
          name="urgence"
          className="w-4 h-4 accent-coplio-red"
        />
        <label htmlFor="urgence" className="flex items-center gap-2 text-sm text-coplio-text cursor-pointer">
          <AlertTriangle className="w-4 h-4 text-coplio-red" />
          <span>
            <strong className="text-coplio-red">Urgence</strong> — Ce problème nécessite une intervention immédiate
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <SinistreSubmitButton />
        <a href="/mes-travaux" className="text-sm text-muted-foreground hover:text-coplio-text transition-colors">
          Annuler
        </a>
      </div>
    </form>
  )
}
