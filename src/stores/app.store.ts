import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Profile, Cabinet, Notification } from '@/types'

interface AppState {
  // Utilisateur courant
  profile: Profile | null
  cabinet: Cabinet | null
  setProfile: (profile: Profile | null) => void
  setCabinet: (cabinet: Cabinet | null) => void

  // Notifications
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifications: Notification[]) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void

  // UI
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Recherche globale
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Utilisateur
      profile: null,
      cabinet: null,
      setProfile: (profile) => set({ profile }),
      setCabinet: (cabinet) => set({ cabinet }),

      // Notifications
      notifications: [],
      unreadCount: 0,
      setNotifications: (notifications) =>
        set({
          notifications,
          unreadCount: notifications.filter((n) => !n.lu).length,
        }),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, lu: true, lu_at: new Date().toISOString() } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            lu: true,
            lu_at: new Date().toISOString(),
          })),
          unreadCount: 0,
        })),

      // UI
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Recherche
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    { name: 'coplio-app' }
  )
)
