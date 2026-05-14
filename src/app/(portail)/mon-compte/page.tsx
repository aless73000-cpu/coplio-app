'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Mail, Phone, Home, Building2, Shield, Hash, Save, CheckCircle2, AlertTriangle } from 'lucide-react'
import { formatEuro } from '@/lib/utils'
import { LOT_TYPE_LABELS } from '@/types'

async function updateProfile(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const prenom = (formData.get('prenom') as string)?.trim()
  const nom = (formData.get('nom') as string)?.trim()
  const telephone = (formData.get('telephone') as string)?.trim()

  if (!prenom || !nom) return

  await supabase
    .from('profiles')
    .update({ prenom, nom, telephone: telephone || null, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  redirect('/mon-compte?saved=1')
}

async function changePassword(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const newPassword = (formData.get('new_password') as string)?.trim()
  const confirm = (formData.get('confirm_password') as string)?.trim()

  if (!newPassword || newPassword.length < 8) {
    redirect('/mon-compte?pwd_error=too_short')
    return
  }
  if (newPassword !== confirm) {
    redirect('/mon-compte?pwd_error=mismatch')
    return
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    redirect('/mon-compte?pwd_error=failed')
    return
  }

  redirect('/mon-compte?pwd_saved=1')
}

export default async function MonComptePage({
  searchParams,
}: {
  searchParams: { saved?: string; pwd_saved?: string; pwd_error?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portail')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, lot:lots(id, numero, type, etage, surface, tantiemes, solde_compte, copropriete:coproprietes(nom, adresse, code_postal, ville))')
    .eq('id', user.id)
    .single()

  const lot = profile?.lot as {
    id: string
    numero: string
    type: string
    etage?: string
    surface?: number
    tantiemes: number
    solde_compte: number
    copropriete: { nom: string; adresse?: string; code_postal?: string; ville?: string }
  } | null

  const initials = `${profile?.prenom?.[0] ?? ''}${profile?.nom?.[0] ?? ''}`.toUpperCase()
  const saved = searchParams?.saved === '1'
  const pwdSaved = searchParams?.pwd_saved === '1'
  const pwdError = searchParams?.pwd_error

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Mon compte</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Vos informations personnelles et votre logement</p>
      </div>

      {/* Confirmation sauvegarde */}
      {saved && (
        <div className="flex items-center gap-3 p-4 bg-coplio-green-light border border-coplio-green/20 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-coplio-green flex-shrink-0" />
          <p className="text-sm font-medium text-coplio-green">Vos informations ont été mises à jour.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Colonne gauche — profil */}
        <div className="col-span-1 space-y-4">
          {/* Avatar */}
          <div className="coplio-card flex flex-col items-center text-center py-8">
            <div className="w-20 h-20 rounded-full bg-coplio-green flex items-center justify-center mb-4">
              <span className="text-white text-2xl font-bold">{initials || <User className="w-8 h-8" />}</span>
            </div>
            <h2 className="font-bold text-coplio-text text-lg">{profile?.prenom} {profile?.nom}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-coplio-green-light text-coplio-green">
              <Shield className="w-3 h-3" />
              Copropriétaire
            </span>
          </div>

          {/* Solde */}
          {lot && (
            <div className={`coplio-card ${lot.solde_compte < 0 ? 'border-red-200 bg-red-50' : 'border-coplio-green/20 bg-coplio-green-light'}`}>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Solde compte</p>
              <p className={`text-3xl font-bold ${lot.solde_compte < 0 ? 'text-red-600' : 'text-coplio-green'}`}>
                {formatEuro(lot.solde_compte)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {lot.solde_compte >= 0 ? 'Votre compte est à jour' : 'Solde débiteur — contactez votre syndic'}
              </p>
            </div>
          )}
        </div>

        {/* Colonne droite — détails */}
        <div className="col-span-2 space-y-4">
          {/* Formulaire coordonnées */}
          <div className="coplio-card">
            <h3 className="font-semibold text-coplio-text mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Mes coordonnées
            </h3>
            <form action={updateProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    Prénom <span className="text-coplio-red">*</span>
                  </label>
                  <input
                    name="prenom"
                    defaultValue={profile?.prenom ?? ''}
                    required
                    placeholder="Votre prénom"
                    className="w-full px-3 py-2.5 bg-coplio-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    Nom <span className="text-coplio-red">*</span>
                  </label>
                  <input
                    name="nom"
                    defaultValue={profile?.nom ?? ''}
                    required
                    placeholder="Votre nom"
                    className="w-full px-3 py-2.5 bg-coplio-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <input
                  type="email"
                  value={user.email ?? ''}
                  disabled
                  className="w-full px-3 py-2.5 bg-coplio-bg border border-border rounded-xl text-sm text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">L&apos;email ne peut pas être modifié ici.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Téléphone
                </label>
                <input
                  name="telephone"
                  defaultValue={profile?.telephone ?? ''}
                  placeholder="+33 6 00 00 00 00"
                  className="w-full px-3 py-2.5 bg-coplio-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-coplio-green text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-coplio-green/90 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>

          {/* Mon logement */}
          {lot && (
            <div className="coplio-card">
              <h3 className="font-semibold text-coplio-text mb-4 flex items-center gap-2">
                <Home className="w-4 h-4 text-muted-foreground" />
                Mon logement
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-coplio-bg rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Numéro de lot</p>
                  <p className="font-bold text-coplio-text text-lg">Lot {lot.numero}</p>
                  {lot.etage && <p className="text-xs text-muted-foreground mt-0.5">{lot.etage}</p>}
                </div>
                <div className="bg-coplio-bg rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Type</p>
                  <p className="font-medium text-coplio-text">
                    {LOT_TYPE_LABELS[lot.type as keyof typeof LOT_TYPE_LABELS] ?? lot.type}
                  </p>
                  {lot.surface && <p className="text-xs text-muted-foreground mt-0.5">{lot.surface} m²</p>}
                </div>
                <div className="bg-coplio-bg rounded-xl p-4 flex items-center gap-3">
                  <Hash className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Tantièmes</p>
                    <p className="font-bold text-coplio-text">{lot.tantiemes} / 10 000</p>
                  </div>
                </div>
                {lot.copropriete && (
                  <div className="bg-coplio-bg rounded-xl p-4 flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Copropriété</p>
                      <p className="font-medium text-coplio-text text-sm truncate">{lot.copropriete.nom}</p>
                      {lot.copropriete.ville && (
                        <p className="text-xs text-muted-foreground">{lot.copropriete.ville}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sécurité — changement de mot de passe inline */}
          <div className="coplio-card">
            <h3 className="font-semibold text-coplio-text mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              Sécurité
            </h3>

            {pwdSaved && (
              <div className="flex items-center gap-3 p-3 bg-coplio-green-light border border-coplio-green/20 rounded-xl mb-4">
                <CheckCircle2 className="w-4 h-4 text-coplio-green flex-shrink-0" />
                <p className="text-sm font-medium text-coplio-green">Mot de passe mis à jour avec succès.</p>
              </div>
            )}
            {pwdError && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  {pwdError === 'mismatch' && 'Les mots de passe ne correspondent pas.'}
                  {pwdError === 'too_short' && 'Le mot de passe doit contenir au moins 8 caractères.'}
                  {pwdError === 'failed' && 'Erreur lors de la modification. Réessayez.'}
                </p>
              </div>
            )}

            <form action={changePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                  Nouveau mot de passe <span className="text-coplio-red">*</span>
                </label>
                <input
                  name="new_password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="8 caractères minimum"
                  className="w-full px-3 py-2.5 bg-coplio-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                  Confirmer le mot de passe <span className="text-coplio-red">*</span>
                </label>
                <input
                  name="confirm_password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Répétez votre nouveau mot de passe"
                  className="w-full px-3 py-2.5 bg-coplio-bg border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent"
                />
              </div>
              <div className="pt-1">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-coplio-text text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-coplio-text/90 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Changer le mot de passe
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
