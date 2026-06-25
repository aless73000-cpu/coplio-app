'use client'

import type { Profile, Cabinet } from '@/types'
import { ProfileSection } from './parametres/ProfileSection'
import { CabinetSection } from './parametres/CabinetSection'
import { ShortcutsSection } from './parametres/ShortcutsSection'
import { SidebarPrefsSection } from './parametres/SidebarPrefsSection'
import { DashboardPrefsSection } from './parametres/DashboardPrefsSection'
import { NotificationsSection } from './parametres/NotificationsSection'
import { TwoFactorSection } from './parametres/TwoFactorSection'
import { HistoriqueSection } from './parametres/HistoriqueSection'

type Props = {
  profile: Profile & { cabinet?: Cabinet | null }
}

export function ParametresClient({ profile }: Props) {
  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-coplio-text">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gérez votre profil et les paramètres de votre cabinet
        </p>
      </div>

      <ProfileSection profile={profile} />
      <CabinetSection cabinet={profile.cabinet} />
      <ShortcutsSection />
      <SidebarPrefsSection userId={profile.id} />
      <DashboardPrefsSection userId={profile.id} />
      <NotificationsSection />
      <TwoFactorSection />
      <HistoriqueSection />
    </div>
  )
}
