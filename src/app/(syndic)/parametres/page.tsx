import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings, Building2, User, Bell, Shield, Palette } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Paramètres' }

export default async function ParamètresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, cabinet:cabinets(*)')
    .eq('id', user.id)
    .single()

  const cabinet = profile?.cabinet

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gérez votre profil et les paramètres de votre cabinet
        </p>
      </div>

      {/* Profil personnel */}
      <section className="coplio-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-coplio-green-light rounded-xl flex items-center justify-center">
            <User className="w-4 h-4 text-coplio-green" />
          </div>
          <h2 className="font-semibold text-coplio-text">Mon profil</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prénom" value={profile?.prenom ?? ''} name="prenom" />
            <Field label="Nom" value={profile?.nom ?? ''} name="nom" />
          </div>
          <Field label="Email" value={profile?.email ?? ''} name="email" type="email" disabled />
          <Field label="Téléphone" value={profile?.telephone ?? ''} name="telephone" type="tel" />
        </div>

        <button className="mt-5 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors">
          Enregistrer les modifications
        </button>
      </section>

      {/* Cabinet */}
      <section className="coplio-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-coplio-green-light rounded-xl flex items-center justify-center">
            <Building2 className="w-4 h-4 text-coplio-green" />
          </div>
          <h2 className="font-semibold text-coplio-text">Mon cabinet</h2>
        </div>

        <div className="space-y-4">
          <Field label="Nom du cabinet" value={cabinet?.nom ?? ''} name="nomCabinet" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="SIRET" value={cabinet?.siret ?? ''} name="siret" />
            <Field label="Téléphone" value={cabinet?.telephone ?? ''} name="tel" type="tel" />
          </div>
          <Field label="Adresse" value={cabinet?.adresse ?? ''} name="adresse" />
          <div className="grid grid-cols-3 gap-4">
            <Field label="Code postal" value={cabinet?.code_postal ?? ''} name="cp" />
            <div className="col-span-2">
              <Field label="Ville" value={cabinet?.ville ?? ''} name="ville" />
            </div>
          </div>
          <Field label="Email de contact" value={cabinet?.email_contact ?? ''} name="emailContact" type="email" />
        </div>

        <button className="mt-5 bg-coplio-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-coplio-green/90 transition-colors">
          Enregistrer
        </button>
      </section>

      {/* Notifications */}
      <section className="coplio-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-coplio-green-light rounded-xl flex items-center justify-center">
            <Bell className="w-4 h-4 text-coplio-green" />
          </div>
          <h2 className="font-semibold text-coplio-text">Notifications</h2>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Récapitulatif quotidien par email', key: 'recap_quotidien', value: cabinet?.recap_quotidien },
            { label: 'Notifications email', key: 'notifications_email', value: cabinet?.notifications_email },
            { label: 'Notifications SMS', key: 'notifications_sms', value: cabinet?.notifications_sms },
          ].map(({ label, key, value }) => (
            <label key={key} className="flex items-center justify-between py-2">
              <span className="text-sm text-coplio-text">{label}</span>
              <div className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${
                value ? 'bg-coplio-green' : 'bg-border'
              }`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  value ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </div>
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}

function Field({
  label,
  value,
  name,
  type = 'text',
  disabled = false,
}: {
  label: string
  value: string
  name: string
  type?: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-coplio-text mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={value}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm border border-border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-coplio-green focus:border-transparent
          ${disabled ? 'bg-coplio-bg text-muted-foreground cursor-not-allowed' : 'bg-white'}`}
      />
    </div>
  )
}
