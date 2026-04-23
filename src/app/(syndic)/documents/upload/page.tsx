'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { DocumentCategory } from '@/types'
import { DOCUMENT_CATEGORY_LABELS } from '@/types'

const inputClass = `w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
  focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent
  placeholder:text-muted-foreground transition-shadow`

export default function DocumentUploadPage() {
  const router = useRouter()
  const [coproprietes, setCoproprietes] = useState<{ id: string; nom: string }[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [nom, setNom] = useState('')
  const [categorie, setCategorie] = useState<DocumentCategory>('autre')
  const [coproprieteId, setCoproprieteId] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('coproprietes').select('id, nom').order('nom').then(({ data }) => {
      if (data) setCoproprietes(data)
    })
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      if (!nom) setNom(f.name.replace(/\.[^/.]+$/, ''))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Sélectionnez un fichier'); return }
    if (!nom.trim()) { setError('Le nom est requis'); return }

    setError('')
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Non authentifié'); setIsSubmitting(false); return }

      // Upload vers Supabase Storage
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, file, { contentType: file.type })

      if (uploadError) {
        setError(`Erreur upload : ${uploadError.message}`)
        setIsSubmitting(false)
        return
      }

      // Enregistrer en base
      const { data: profile } = await supabase
        .from('profiles')
        .select('cabinet_id')
        .eq('id', user.id)
        .single()

      const { error: dbError } = await supabase.from('documents').insert({
        cabinet_id: profile?.cabinet_id,
        copropriete_id: coproprieteId || null,
        nom: nom.trim(),
        description: description.trim() || null,
        categorie,
        taille_bytes: file.size,
        type_mime: file.type,
        storage_path: path,
        storage_bucket: 'documents',
        upload_par: user.id,
      })

      if (dbError) {
        setError(`Erreur enregistrement : ${dbError.message}`)
        // Rollback upload
        await supabase.storage.from('documents').remove([path])
        setIsSubmitting(false)
        return
      }

      router.push('/documents')
    } catch {
      setError('Erreur inattendue')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/documents" className="text-muted-foreground hover:text-coplio-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-coplio-text">Importer un document</h1>
          <p className="text-muted-foreground text-sm">PV d&apos;AG, budget, contrat, sinistre...</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {/* Zone de drop */}
        <div className="coplio-card">
          <label
            className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              file ? 'border-coplio-green bg-coplio-green-light/30' : 'border-border hover:border-coplio-green/50 hover:bg-coplio-bg'
            }`}
          >
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-coplio-green" />
                <p className="text-sm font-medium text-coplio-text">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} Mo
                </p>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setFile(null); setNom('') }}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  <X className="w-3 h-3" /> Supprimer
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center px-4">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm font-medium text-coplio-text">Cliquez pour sélectionner un fichier</p>
                <p className="text-xs text-muted-foreground">PDF, Word, Excel, images — max 50 Mo</p>
              </div>
            )}
          </label>
        </div>

        {/* Infos document */}
        <div className="coplio-card space-y-4">
          <h2 className="font-semibold text-coplio-text">Informations</h2>

          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Nom du document *</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className={inputClass}
              placeholder="PV AG 2026, Budget prévisionnel..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Catégorie</label>
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value as DocumentCategory)}
                className={inputClass}
              >
                {(Object.entries(DOCUMENT_CATEGORY_LABELS) as [DocumentCategory, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-coplio-text mb-1.5">Copropriété</label>
              <select
                value={coproprieteId}
                onChange={(e) => setCoproprieteId(e.target.value)}
                className={inputClass}
              >
                <option value="">Toutes</option>
                {coproprietes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-coplio-text mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              rows={2}
              placeholder="Description optionnelle..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/documents"
            className="flex-1 text-center bg-coplio-bg text-coplio-text font-medium py-2.5 px-4 rounded-lg hover:bg-border transition-colors text-sm"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !file}
            className="flex-1 bg-coplio-green text-white font-medium py-2.5 px-4 rounded-lg hover:bg-coplio-green/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isSubmitting ? 'Import en cours...' : 'Importer'}
          </button>
        </div>
      </form>
    </div>
  )
}
