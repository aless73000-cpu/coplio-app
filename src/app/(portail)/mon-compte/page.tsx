'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  User, Mail, Phone, Home, Building2, Shield,
  Hash, Save, CheckCircle2, AlertTriangle, LogOut,
  MessageCircle,
} from 'lucide-react'
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
    .select('*, lot:lots(id, numero, type, etage, surface, tantiemes, solde_compte, copropriete:coproprietes(id, nom, adresse, code_postal, ville, cabinet_id, cabinet:cabinets(nom, email_contact, telephone)))')
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
    copropriete: {
      id: string
      nom: string
      adresse?: string
      code_postal?: string
      ville?: string
      cabinet_id: string
      cabinet?: { nom: string; email_contact?: string; telephone?: string }
    }
  } | null

  const saved = searchParams?.saved === '1'
  const pwdSaved = searchParams?.pwd_saved === '1'
  const pwdError = searchParams?.pwd_error

  const initials = `${profile?.prenom?.[0] ?? ''}${profile?.nom?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Mon compte</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Vos informations personnelles et votre logement</p>
      </div>

      {/* Save confirmation */}
      {saved && (
        <div className="flex items-center gap-3 p-4 bg-coplio-green-light border border-coplio-green/20 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-coplio-green flex-shrink-0" />
          <p className="text-sm font-medium text-coplio-green">Vos informations ont été mises à jour.</p>
        </div>
      )}

      {/* ─── Section: Mes informations ─── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Section header */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 bg-coplio-green rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">{initials || <User className="w-5 h-5" />}</span>
          </div>
          <div>
            <h2 className="font-semibold text-coplio-text">Mes informations</h2>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-coplio-green-light text-coplio-green">
            <Shield className="w-3 h-3" />
            Copropriétaire
          </span>
        </div>

        <form action={updateProfile} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              readOnly
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

          <div className="pt-1">
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

      {/* ─── Section: Mon logement ─── */}
      {lot && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Home className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-coplio-text">Mon logement</h2>
          </div>
          <div className="p-5">
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-coplio-bg rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Numéro de lot</p>
                <p className="font-bold text-coplio-text text-lg">Lot {lot.numero}</p>
                {lot.etage && <p className="text-xs text-muted-foreground mt-0.5">{lot.etage}</p>}
              </div>
              <div className="bg-coplio-bg rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Type</p>
                <p className="font-semibold text-coplio-text">
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
                    <p className="font-semibold text-coplio-text text-sm truncate">{lot.copropriete.nom}</p>
                    {lot.copropriete.ville && (
                      <p className="text-xs text-muted-foreground">{lot.copropriete.ville}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Solde lot */}
            {lot.solde_compte != null && (
              <div className={`mt-3 flex items-center gap-3 p-4 rounded-xl border ${
                lot.solde_compte >= 0
                  ? 'bg-coplio-green-light border-coplio-green/20'
                  : 'bg-coplio-red-bg border-coplio-red/20'
              }`}>
                {lot.solde_compte >= 0
                  ? <CheckCircle2 className="w-5 h-5 text-coplio-green flex-shrink-0" />
                  : <AlertTriangle className="w-5 h-5 text-coplio-red flex-shrink-0" />
                }
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Solde compte lot</p>
                  <p className={`font-bold text-lg ${lot.solde_compte >= 0 ? 'text-coplio-green' : 'text-coplio-red'}`}>
                    {lot.solde_compte >= 0 ? '+' : ''}{lot.solde_compte.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lot.solde_compte >= 0 ? 'Votre compte est à jour' : 'Solde débiteur — contactez votre syndic'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Section: Mon syndic ─── */}
      {lot?.copropriete?.cabinet && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-coplio-text">Mon syndic</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-coplio-green-light rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-coplio-green" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-coplio-text">{lot.copropriete.cabinet.nom}</p>
                {lot.copropriete.nom && (
                  <p className="text-xs text-muted-foreground mt-0.5">Gestionnaire de {lot.copropriete.nom}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lot.copropriete.cabinet.email_contact && (
                <div className="bg-coplio-bg rounded-xl p-3 flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${lot.copropriete.cabinet.email_contact}`}
                      className="text-sm font-medium text-coplio-text hover:text-coplio-green transition-colors truncate block"
                    >
                      {lot.copropriete.cabinet.email_contact}
                    </a>
                  </div>
                </div>
              )}
              {lot.copropriete.cabinet.telephone && (
                <div className="bg-coplio-bg rounded-xl p-3 flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <a
                      href={`tel:${lot.copropriete.cabinet.telephone}`}
                      className="text-sm font-medium text-coplio-text hover:text-coplio-green transition-colors"
                    >
                      {lot.copropriete.cabinet.telephone}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <a
              href="/mes-messages"
              className="inline-flex items-center gap-2 bg-coplio-green text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-coplio-green/90 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Envoyer un message
            </a>
          </div>
        </div>
      )}

      {/* ─── Section: Sécurité ─── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-coplio-text">Sécurité</h2>
        </div>
        <div className="p-5">
          {pwdSaved && (
            <div className="flex items-center gap-3 p-3 bg-coplio-green-light border border-coplio-green/20 rounded-xl mb-4">
              <CheckCircle2 className="w-4 h-4 text-coplio-green flex-shrink-0" />
              <p className="text-sm font-medium text-coplio-green">Mot de passe mis à jour avec succès.</p>
            </div>
          )}
          {pwdError && (
            <div className="flex items-center gap-3 p-3 bg-coplio-red-bg border border-coplio-red/20 rounded-xl mb-4">
              <AlertTriangle className="w-4 h-4 text-coplio-red flex-shrink-0" />
              <p className="text-sm text-coplio-red">
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

      {/* ─── Déconnexion ─── */}
      <div className="pt-2 pb-6">
        <div className="border-t border-border pt-5">
          <form action="/portail/deconnexion" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-coplio-red transition-colors px-4 py-2 rounded-xl hover:bg-coplio-red-bg"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
