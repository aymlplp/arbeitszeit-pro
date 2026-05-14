// src/components/Header.jsx — compact side-by-side layout
import { useCallback } from 'react'
import { LANGS, LANG_NAMES } from '@/lib/i18n'
import useAppStore from '@/store/useAppStore'
import { PlanBadge } from './UI'

export default function Header({ t, onOpenAreas, onOpenArchive, onLogout }) {
  const { settings, updateSettings, lang, setLang, currentUser, areas, isSaving } = useAppStore()

  const cycleLang = useCallback(() => {
    const idx = LANGS.indexOf(lang)
    setLang(LANGS[(idx + 1) % LANGS.length])
  }, [lang, setLang])

  const init = str => str?.trim()?.[0]?.toUpperCase() || '?'

  return (
    <div className="glass rounded-2xl p-3 mb-3">
      {/* ── Row 1: avatars + inputs side by side ── */}
      <div className="flex items-center gap-2 mb-2.5">

        {/* Company block */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="flex flex-col items-center shrink-0">
            <span className="text-[8px] font-bold tracking-widest text-purple-400/60 uppercase mb-1">
              {lang==='ar'?'شركة':lang==='en'?'CO':'FIRMA'}
            </span>
            <div className="w-8 h-8 rounded-full bg-white/70 border border-purple-200 flex items-center justify-center text-purple-600 font-bold text-sm">
              {init(settings.co)}
            </div>
          </div>
          <input
            value={settings.co || ''}
            onChange={e => updateSettings({ co: e.target.value })}
            placeholder={lang==='ar'?'الشركة':lang==='en'?'Company':'Firma'}
            className="flex-1 min-w-0 bg-white/60 border border-purple-200 rounded-xl px-2.5 py-1.5 text-sm text-purple-900 outline-none focus:border-purple-500 focus:bg-white/90 placeholder-purple-400/40"
          />
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-purple-200 shrink-0" />

        {/* Employee block */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="flex flex-col items-center shrink-0">
            <span className="text-[8px] font-bold tracking-widest text-purple-400/60 uppercase mb-1">
              {lang==='ar'?'موظف':lang==='en'?'EMP':'MITARB.'}
            </span>
            <div className="w-8 h-8 rounded-full bg-white/70 border border-purple-200 flex items-center justify-center text-purple-600 font-bold text-sm">
              {init(settings.name)}
            </div>
          </div>
          <input
            value={settings.name || ''}
            onChange={e => updateSettings({ name: e.target.value })}
            placeholder={lang==='ar'?'الاسم':lang==='en'?'Name':'Name'}
            className="flex-1 min-w-0 bg-white/60 border border-purple-200 rounded-xl px-2.5 py-1.5 text-sm text-purple-900 outline-none focus:border-purple-500 focus:bg-white/90 placeholder-purple-400/40"
          />
        </div>
      </div>

      {/* ── Row 2: action buttons ── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={cycleLang}
          className="inline-flex items-center gap-1 bg-white/70 border border-purple-200 rounded-full px-2.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-white/90 transition-all cursor-pointer">
          🌐 {LANG_NAMES[lang]} ▾
        </button>

        <button onClick={onOpenAreas}
          className="inline-flex items-center gap-1 bg-white/70 border border-purple-200 rounded-full px-2.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-white/90 transition-all cursor-pointer">
          ⇄ {lang==='ar'?'المناطق':lang==='en'?'Areas':'Bereiche'}
          <span className="bg-purple-600 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold ml-0.5">{areas.length}</span>
        </button>

        <button onClick={onOpenArchive}
          className="inline-flex items-center gap-1 bg-white/70 border border-purple-200 rounded-full px-2.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-white/90 transition-all cursor-pointer">
          ⊡ {lang==='ar'?'الأرشيف':lang==='en'?'Archive':'Archiv'}
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          {isSaving && (
            <div className="w-3 h-3 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          )}
          {currentUser && <PlanBadge plan={currentUser.plan} />}
          {onLogout && (
            <button onClick={onLogout}
              className="text-xs text-red-400 hover:text-red-600 transition-all cursor-pointer font-medium bg-red-50 px-2 py-1 rounded-full border border-red-200">
              ↩
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
