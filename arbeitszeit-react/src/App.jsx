// src/App.jsx
import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { authInit, logout } from '@/lib/auth'
import useAppStore from '@/store/useAppStore'
import { T, useT } from '@/lib/i18n'
import Header       from '@/components/Header'
import WeekView     from '@/components/Week/WeekView'
import ReportsView  from '@/components/Reports/ReportsView'
import SalaryView   from '@/components/Salary/SalaryView'
import SettingsView from '@/components/Settings/SettingsView'
import ArchiveView  from '@/components/Archive/ArchiveView'
import AuthFlow     from '@/components/Auth/AuthFlow'
import MobileSignView from '@/components/Settings/MobileSignView'
import { getAccessToken, setAuthToken } from '@/lib/auth'
import { CalendarDays, FileSpreadsheet, Coins, Settings as LucideSettings } from 'lucide-react'

const MAIN_TABS = ['zeit', 'rep', 'sal']

export default function App() {
  const { lang, currentUser, setCurrentUser, loadFromCloud, activeTab, setActiveTab } = useAppStore()
  const t = useT(lang)
  const [authChecked, setAuthChecked] = useState(false)
  const [showAuth,    setShowAuth]    = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const mobileSignToken = urlParams.get('mobileSignToken')
    const mobileSignTopic = urlParams.get('mobileSignTopic')

    if (mobileSignTopic) {
      // Ephemeral offline signing bypasses auth
      setAuthChecked(true)
      return
    }

    if (mobileSignToken) {
      setAuthToken(mobileSignToken)
      authInit().then(user => {
        if (user) { setCurrentUser(user); loadFromCloud() }
        setAuthChecked(true)
      })
      return
    }

    const apiUrl = import.meta.env.VITE_API_URL
    if (!apiUrl) { setAuthChecked(true); return }
    authInit().then(user => {
      if (user) { setCurrentUser(user); loadFromCloud() }
      else setShowAuth(true)
      setAuthChecked(true)
    })

    const onFocus = () => {
      if (useAppStore.getState().currentUser) {
        useAppStore.getState().loadFromCloud()
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  const handleAuthSuccess = user => {
    setCurrentUser(user); setShowAuth(false)
    if (user) loadFromCloud()
  }

  const handleLogout = async () => {
    await logout(); setCurrentUser(null); setShowAuth(true)
  }

  if (!authChecked) return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{background:'linear-gradient(135deg,#1e1854,#5b4fcf)'}}>
      <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-3xl mb-4">⏱</div>
      <h1 className="text-white text-xl font-bold mb-6">Arbeitszeit Pro</h1>
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"/>
    </div>
  )

  if (showAuth) return (
    <>
      <AuthFlow onSuccess={handleAuthSuccess}/>
      <Toaster position="bottom-center" toastOptions={{style:{borderRadius:'20px'}}}/>
    </>
  )

  const urlParams = new URLSearchParams(window.location.search)
  const mobileSignTopic = urlParams.get('mobileSignTopic')
  if (urlParams.get('mobileSignToken') || mobileSignTopic) {
    return (
      <>
        <MobileSignView topic={mobileSignTopic} />
        <Toaster position="bottom-center" toastOptions={{style:{borderRadius:'20px'}}}/>
      </>
    )
  }

  const TAB_CFG = [
    { id:'zeit', icon:'📅', label: lang==='ar'?'تسجيل الوقت':lang==='en'?'Time Tracking':'Zeiterfassung', activeColor:'bg-purple-600 shadow-purple-500/35' },
    { id:'rep',  icon:'📄', label: lang==='ar'?'التقارير':lang==='en'?'Reports':'Berichte',               activeColor:'bg-purple-600 shadow-purple-500/35' },
    { id:'sal',  icon:'€',  label: lang==='ar'?'الراتب':lang==='en'?'Salary':'Gehalt',                    activeColor:'bg-green-700 shadow-green-700/30' },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'zeit': return <WeekView     t={t} key="zeit"/>
      case 'rep':  return <ReportsView  t={t} key="rep"/>
      case 'sal':  return <SalaryView   t={t} key="sal"/>
      case 'set':  return <SettingsView t={t} onBack={()=>setActiveTab('zeit')} key="set"/>
      case 'arch': return <ArchiveView  t={t} onBack={()=>setActiveTab('zeit')} key="arch"/>
      default:     return <WeekView     t={t} key="zeit"/>
    }
  }

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(135deg,#e8e0f5,#d4c8f0,#c9b8e8,#e0c8e8)',backgroundAttachment:'fixed'}}>
      <div className="max-w-3xl mx-auto px-3 py-3 pb-24 sm:pb-12">

        <Header
          t={t}
          onOpenAreas={()=>setActiveTab('set')}
          onOpenArchive={()=>setActiveTab('arch')}
          onLogout={currentUser ? handleLogout : null}
        />

        {/* Upgrade bar */}
        {currentUser?.plan==='free' && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl mb-3 text-sm text-white"
            style={{background:'linear-gradient(90deg,#5b4fcf,#7c6fd4)'}}>
            <span>⭐ {lang==='ar'?'النسخة المجانية':lang==='en'?'Free version — upgrade for all features':'Free-Version — alle Funktionen freischalten'}</span>
            <button className="bg-white text-purple-700 font-bold text-xs rounded-full px-3 py-1 cursor-pointer hover:bg-purple-50">
              {lang==='ar'?'ترقية إلى Pro':lang==='en'?'Upgrade →':'Pro upgraden →'}
            </button>
          </div>
        )}

        {/* Main tabs — only show when on a main tab (hidden on mobile, shown on desktop) */}
        {MAIN_TABS.includes(activeTab) && (
          <div className="hidden sm:flex gap-2 mb-3">
            {TAB_CFG.map(tab => (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-all border
                  ${activeTab===tab.id
                    ? `${tab.activeColor} text-white border-transparent shadow-lg`
                    : 'bg-white/55 text-purple-700 border-purple-200 hover:bg-white/78'}`}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}}
            transition={{duration:0.18}}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Premium Fixed Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl shadow-[0_-5px_20px_rgba(48,36,100,0.06)] border-t border-purple-100/60 px-2 py-2 pb-safe sm:hidden flex items-center justify-around select-none">
        {[
          { id: 'zeit', icon: CalendarDays,    lbl: { de:'Zeit', en:'Time', ar:'الوقت' } },
          { id: 'rep',  icon: FileSpreadsheet, lbl: { de:'Berichte', en:'Reports', ar:'التقارير' } },
          { id: 'sal',  icon: Coins,           lbl: { de:'Gehalt', en:'Salary', ar:'الراتب' } },
          { id: 'set',  icon: LucideSettings,  lbl: { de:'Einstell.', en:'Settings', ar:'الإعدادات' } },
        ].map(item => {
          const Icon = item.icon
          const isActive = item.id === 'set' 
            ? (activeTab === 'set' || activeTab === 'arch') 
            : activeTab === item.id
          
          const label = item.lbl[lang] || item.lbl.de
          
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-0.5 cursor-pointer transition-all duration-150 active:scale-95 
                ${isActive ? 'text-purple-700 font-bold' : 'text-purple-400 hover:text-purple-500 font-medium'}`}>
              <div className={`p-1.5 rounded-xl transition-all duration-300 relative flex items-center justify-center ${isActive ? 'bg-purple-600/10' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`transition-all duration-300 ${isActive ? 'scale-110 text-purple-600' : ''}`} />
                {isActive && (
                  <motion.div layoutId="activeMobileTab" className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-purple-600" transition={{type:'spring',stiffness:380,damping:30}} />
                )}
              </div>
              <span className="text-[9px] tracking-tight leading-none max-w-full truncate px-0.5">{label}</span>
            </button>
          )
        })}
      </div>

      <Toaster position="bottom-center" toastOptions={{
        style:{borderRadius:'20px',fontFamily:'DM Sans, sans-serif',background:'#1e1854',color:'#fff'},
        success:{iconTheme:{primary:'#a5d6a7',secondary:'#1e1854'}},
        error:  {iconTheme:{primary:'#ef9a9a',secondary:'#1e1854'}},
      }}/>
    </div>
  )
}
