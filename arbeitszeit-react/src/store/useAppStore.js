// src/store/useAppStore.js — Zustand global state
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getYearData, saveYearData } from '@/lib/auth'

const DEFAULT_AREAS = ['المكتب الرئيسي', 'موقع العميل', 'المستودع']
const DEFAULT_ACTS  = ['UR', 'Reinigung', 'Kontrolle', 'Wartung', 'Sonstiges']

const DEFAULT_SETTINGS = {
  name: '', co: '', email: '', phone: '', addr: '',
  rate: 0, language: 'de',
}

let saveTimer = null

const useAppStore = create(
  persist(
    (set, get) => ({
      // ── User ────────────────────────────────────────────────
      currentUser:    null,
      setCurrentUser: (user) => set({ currentUser: user }),

      // ── Data ────────────────────────────────────────────────
      aData:    {},
      aYear:    new Date().getFullYear(),
      archivedYears: [],

      setAData:         (aData)    => set({ aData }),
      setAYear:         (aYear)    => set({ aYear }),
      setArchivedYears: (years)    => set({ archivedYears: years }),

      updateDayData: (isoDate, dayData) => {
        set(s => ({ aData: { ...s.aData, [isoDate]: dayData } }))
        get().scheduleSave()
      },

      // ── Settings ────────────────────────────────────────────
      settings: DEFAULT_SETTINGS,
      areas:    DEFAULT_AREAS,
      acts:     DEFAULT_ACTS,

      updateSettings: (partial) => {
        set(s => ({ settings: { ...s.settings, ...partial } }))
        get().scheduleSave()
      },
      setAreas: (areas) => { set({ areas }); get().scheduleSave() },
      setActs:  (acts)  => { set({ acts });  get().scheduleSave() },

      // ── Language ─────────────────────────────────────────────
      lang:    'de',
      setLang: (lang) => {
        set({ lang })
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
        get().scheduleSave()
      },

      // ── UI state ─────────────────────────────────────────────
      weekOffset: 0,
      selDay:     -1,
      activeTab:  'zeit',

      setWeekOffset: (weekOffset) => set({ weekOffset }),
      setSelDay:     (selDay)     => set({ selDay }),
      setActiveTab:  (activeTab)  => set({ activeTab }),

      // ── Cloud save ───────────────────────────────────────────
      isSaving: false,
      lastSaved: null,

      scheduleSave() {
        clearTimeout(saveTimer)
        saveTimer = setTimeout(() => get().doSave(), 1500)
      },

      async doSave() {
        const { aData, aYear, settings, areas, acts, archivedYears, lang, currentUser } = get()
        if (!currentUser) {
          // Offline: saved via persist middleware (localStorage)
          return
        }
        try {
          set({ isSaving: true })
          await saveYearData(aYear, aData, { settings, areas, acts, archivedYears, lang })
          set({ isSaving: false, lastSaved: new Date() })
        } catch (e) {
          set({ isSaving: false })
          console.warn('Cloud save failed:', e.message)
        }
      },

      async loadFromCloud(year) {
        const { currentUser } = get()
        if (!currentUser) return
        try {
          const d = await getYearData(year || get().aYear)
          if (d.data) set({ aData: d.data })
          if (d.settings) {
            const s = d.settings
            if (s.settings) set(st => ({ settings: { ...st.settings, ...s.settings } }))
            if (s.areas?.length) set({ areas: s.areas })
            if (s.acts?.length)  set({ acts:  s.acts  })
            if (s.archivedYears) set({ archivedYears: s.archivedYears })
            if (s.lang) {
              set({ lang: s.lang })
              document.documentElement.dir = s.lang === 'ar' ? 'rtl' : 'ltr'
            }
          }
        } catch (e) {
          console.warn('Cloud load failed:', e.message)
        }
      },
    }),
    {
      name:    'zt-pro-v2',
      version: 2,
      // Only persist offline data (cloud users get fresh data from API)
      partialize: (s) => ({
        aData:         s.aData,
        aYear:         s.aYear,
        archivedYears: s.archivedYears,
        settings:      s.settings,
        areas:         s.areas,
        acts:          s.acts,
        lang:          s.lang,
      }),
    }
  )
)

export default useAppStore
