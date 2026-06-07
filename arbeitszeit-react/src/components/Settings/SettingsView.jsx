// src/components/Settings/SettingsView.jsx
import { useEffect, useRef, useState } from 'react'
import useAppStore from '@/store/useAppStore'
import { Button, SectionHeader, Divider } from '@/components/UI'
import { changePassword, startCheckout, openBillingPortal, getAccessToken, linkEmployer, unlinkEmployer } from '@/lib/auth'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'

export default function SettingsView({ t, onBack }) {
  const { settings, updateSettings, areas, setAreas, acts, setActs, currentUser, lang, setCurrentUser } = useAppStore()
  const [activeSubTab, setActiveSubTab] = useState('personal')
  const canvasRef = useRef(null)
  const sigCtxRef = useRef(null)
  const drawingRef = useRef(false)
  const [newArea, setNewArea] = useState({name:'', start:'', end:''})
  const [newAct,  setNewAct]  = useState('')
  const [pw, setPw] = useState({ cur: '', new: '' })
  const [saving, setSaving] = useState(false)
  const [sessionTopic] = useState(() => 'azp_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10))
  const [isWaitingSig, setIsWaitingSig] = useState(false)
  const [employerCodeInput, setEmployerCodeInput] = useState('')
  const [linkingEmployerState, setLinkingEmployerState] = useState(false)

  // EventSource for ephemeral Real-time Signature streaming
  useEffect(() => {
    const topicUrl = `https://ntfy.sh/${sessionTopic}/sse`
    const es = new EventSource(topicUrl)
    
    es.onopen = () => setIsWaitingSig(true)
    es.onerror = () => setIsWaitingSig(false)

    es.onmessage = async (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.event === 'message' && data.attachment?.url) {
          const res = await fetch(data.attachment.url)
          const blob = await res.blob()
          const reader = new FileReader()
          reader.onloadend = () => {
            updateSettings({ signature: reader.result })
            toast.success(lang === 'ar' ? '✓ تم استقبال التوقيع من الجوال!' : lang === 'en' ? '✓ Signature received from phone!' : '✓ Unterschrift empfangen!')
          }
          reader.readAsDataURL(blob)
        }
      } catch (err) {
        console.error("P2P Receive Error:", err)
      }
    }

    return () => es.close()
  }, [sessionTopic, updateSettings, lang])

  // Signature canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || sigCtxRef.current) return
    canvas.width  = canvas.clientWidth  || 290
    canvas.height = 90
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#1e1854'
    ctx.lineWidth   = 2
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    sigCtxRef.current = ctx

    const getPos = (e, c) => {
      const r   = c.getBoundingClientRect()
      const src = e.touches ? e.touches[0] : e
      return { x: src.clientX - r.left, y: src.clientY - r.top }
    }
    const start = e => { drawingRef.current = true; ctx.beginPath(); const p = getPos(e, canvas); ctx.moveTo(p.x, p.y) }
    const move  = e => { if (!drawingRef.current) return; const p = getPos(e, canvas); ctx.lineTo(p.x, p.y); ctx.stroke() }
    const stop  = () => { drawingRef.current = false }

    canvas.addEventListener('mousedown',  start)
    canvas.addEventListener('mousemove',  move)
    canvas.addEventListener('mouseup',    stop)
    canvas.addEventListener('mouseleave', stop)
    canvas.addEventListener('touchstart', e => { e.preventDefault(); start(e) }, { passive: false })
    canvas.addEventListener('touchmove',  e => { e.preventDefault(); move(e)  }, { passive: false })
    canvas.addEventListener('touchend',   stop)
  }, [])

  const clearSig = () => {
    const c = canvasRef.current
    if (c && sigCtxRef.current) sigCtxRef.current.clearRect(0, 0, c.width, c.height)
    updateSettings({ signature: '' })
  }

  const saveLocalSig = () => {
    const c = canvasRef.current
    if (c) {
      updateSettings({ signature: c.toDataURL('image/png') })
      toast.success(t.save ? t.save + '!' : 'Unterschrift gespeichert!')
    }
  }

  const mobileSignUrl = currentUser ? `${window.location.origin}/?mobileSignToken=${getAccessToken()}` : ''
  const directSignUrl = `${window.location.origin}/?mobileSignTopic=${sessionTopic}`

  const addArea = () => {
    if (currentUser?.plan?.toLowerCase() !== 'pro' && areas.length >= 1) {
      toast.error(lang === 'ar' ? 'النسخة المجانية تدعم موقعاً واحداً فقط. يرجى الترقية للـ Pro.' : lang === 'en' ? 'Free version supports only 1 work area. Please upgrade to PRO.' : 'Die kostenlose Version unterstützt nur 1 Bereich. Bitte auf PRO upgraden.')
      return
    }
    const val = typeof newArea === 'string' ? {name: newArea} : newArea;
    if (!val.name || !val.name.trim()) return
    setAreas([...areas, { ...val, name: val.name.trim() }])
    setNewArea({name:'', start:'', end:''})
  }
  const removeArea = i => setAreas(areas.filter((_, idx) => idx !== i))

  const addAct = () => {
    if (!newAct.trim()) return
    setActs([...acts, newAct.trim()])
    setNewAct('')
  }
  const removeAct = i => setActs(acts.filter((_, idx) => idx !== i))

  const doChangePw = async () => {
    if (!pw.cur || !pw.new) { toast.error('Alle Felder ausfüllen'); return }
    if (!currentUser) { toast.error('Bitte mit Backend verbinden'); return }
    try {
      setSaving(true)
      await changePassword(pw.cur, pw.new)
      toast.success('Passwort geändert! Bitte neu anmelden.')
      setTimeout(() => window.location.reload(), 2000)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLinkEmployer = async () => {
    if (!employerCodeInput.trim()) return
    setLinkingEmployerState(true)
    try {
      const res = await linkEmployer(employerCodeInput)
      setCurrentUser(res.user)
      toast.success(lang === 'ar' ? 'تم ربط الحساب بنجاح!' : 'Employer linked successfully!')
      setEmployerCodeInput('')
    } catch (err) {
      toast.error(err.message || (lang === 'ar' ? 'فشل ربط الحساب' : 'Failed to link employer'))
    } finally {
      setLinkingEmployerState(false)
    }
  }

  const handleUnlinkEmployer = async () => {
    setLinkingEmployerState(true)
    try {
      const res = await unlinkEmployer()
      setCurrentUser(res.user)
      toast.success(lang === 'ar' ? 'تم إلغاء ربط الحساب' : 'Employer unlinked successfully!')
    } catch (err) {
      toast.error(err.message || (lang === 'ar' ? 'فشل إلغاء ربط الحساب' : 'Failed to unlink employer'))
    } finally {
      setLinkingEmployerState(false)
    }
  }

  const LI_CLS = 'flex items-center gap-2 mb-2'
  const LI_INP = 'flex-1 bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm text-purple-900 outline-none focus:border-purple-500'
  const LI_DEL = 'w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-100 transition-all cursor-pointer shrink-0 text-sm'

  const TABS = [
    { id: 'personal', icon: '🏢', label: lang === 'ar' ? 'الشركة والاسم' : lang === 'en' ? 'Company & Name' : 'Firma & Name' },
    { id: 'areas',    icon: '📍', label: lang === 'ar' ? 'المواقع' : lang === 'en' ? 'Sites' : 'Standorte' },
    { id: 'acts',     icon: '🔨', label: lang === 'ar' ? 'الأنشطة' : lang === 'en' ? 'Activities' : 'Tätigkeiten' },
    { id: 'sig',      icon: '✍️', label: lang === 'ar' ? 'التوقيع' : lang === 'en' ? 'Signature' : 'Unterschrift' },
  ]

  return (
    <div className="glass-light rounded-2xl shadow-lg flex flex-col overflow-hidden border border-purple-100/20">
      
      {/* Horizontal Tabs Header matching reference design */}
      <div className="flex bg-white/30 border-b border-purple-100 overflow-x-auto shrink-0">
        {TABS.map(tb => {
          const isActive = activeSubTab === tb.id
          return (
            <button
              key={tb.id}
              onClick={() => setActiveSubTab(tb.id)}
              className={`flex-1 min-w-[75px] flex flex-col items-center justify-center py-3 px-1 cursor-pointer transition-all relative border-b-2 outline-none
                ${isActive 
                  ? 'bg-white border-purple-600 text-purple-900 font-bold shadow-sm' 
                  : 'border-transparent text-purple-500/75 hover:bg-white/40 font-semibold'
                }`}
            >
              <span className="text-lg mb-0.5">{tb.icon}</span>
              <span className="text-[10px] sm:text-xs whitespace-nowrap tracking-wide">{tb.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tabs Container */}
      <div className="p-5 flex-1 min-h-0 overflow-y-auto">
        
        {/* Tab 1: Personal Data & Account Settings */}
        <div style={{ display: activeSubTab === 'personal' ? 'block' : 'none' }} className="space-y-4">
          <SectionHeader>{t.personalData}</SectionHeader>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'name',  label: t.name,    type: 'text',  ph: 'Max Mustermann' },
              { key: 'co',    label: t.company, type: 'text',  ph: 'Muster GmbH' },
              { key: 'email', label: t.email,   type: 'email', ph: 'info@musterfirma.de' },
              { key: 'phone', label: t.phone,   type: 'tel',   ph: '+49 123 456789' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-purple-500/70 mb-1">{f.label}</label>
                <input type={f.type} placeholder={f.ph} value={settings[f.key] || ''}
                  onChange={e => updateSettings({ [f.key]: e.target.value })}
                  className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm text-purple-900 outline-none focus:border-purple-500"
                />
              </div>
            ))}
          </div>

          {currentUser && (
            <div className="space-y-4 mt-4">
              <Divider />
              <SectionHeader>{t.changePw || 'Passwort ändern'}</SectionHeader>
              <div className="space-y-2">
                <input type="password" placeholder={t.currentPw || 'Aktuelles Passwort'} value={pw.cur}
                  onChange={e => setPw(p => ({ ...p, cur: e.target.value }))}
                  className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm text-purple-900 outline-none focus:border-purple-500"
                />
                <input type="password" placeholder={t.newPw || 'Neues Passwort'} value={pw.new}
                  onChange={e => setPw(p => ({ ...p, new: e.target.value }))}
                  className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm text-purple-900 outline-none focus:border-purple-500"
                />
                <Button variant="danger" onClick={doChangePw} disabled={saving} className="w-full justify-center">
                  {saving ? '…' : (t.changePw || 'Passwort ändern')}
                </Button>
              </div>

              <Divider />
              <SectionHeader>Abonnement & Abrechnung</SectionHeader>
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-purple-900">Aktueller Plan</p>
                    <p className="text-xs text-purple-600">{currentUser.plan?.toLowerCase() === 'pro' ? 'Pro Version (Aktiv)' : 'Kostenlose Version'}</p>
                  </div>
                </div>
                {currentUser.plan?.toLowerCase() !== 'pro' ? (
                  <div className="space-y-2">
                    <Button variant="primary" onClick={() => startCheckout('pro_monthly')} className="w-full justify-center">
                      {currentUser.role === 'EMPLOYER'
                        ? (lang === 'ar' ? 'اشتراك شهري (4.99€ / شهر) ➔' : lang === 'en' ? 'Monthly Plan (4.99€/Mo) ➔' : 'Monatlich abonnieren (4.99€/Mo) ➔')
                        : (lang === 'ar' ? 'اشتراك شهري (2€ / شهر) ➔' : lang === 'en' ? 'Monthly Plan (2€/Mo) ➔' : 'Monatlich abonnieren (2€/Mo) ➔')}
                    </Button>
                    <Button variant="ghost" onClick={() => startCheckout('pro_yearly')} className="w-full justify-center border border-purple-300 bg-white hover:bg-purple-100">
                      {currentUser.role === 'EMPLOYER'
                        ? (lang === 'ar' ? 'اشتراك سنوي (34.99€ / سنة - توفير 41%) ➔' : lang === 'en' ? 'Annual Plan (34.99€/Yr - Save 41%) ➔' : 'Jährlich abonnieren (34.99€/Jahr - 41% sparen) ➔')
                        : (lang === 'ar' ? 'اشتراك سنوي (15€ / سنة - توفير 37%) ➔' : lang === 'en' ? 'Annual Plan (15€/Yr - Save 37%) ➔' : 'Jährlich abonnieren (15€/Jahr - 37% sparen) ➔')}
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" onClick={() => openBillingPortal()} className="w-full justify-center border border-purple-200">
                    Kundenportal öffnen
                  </Button>
                )}
              </div>

              {/* Employer Connection Section */}
              {currentUser.role === 'USER' && (
                <>
                  <Divider />
                  <SectionHeader>{lang === 'ar' ? 'ربط صاحب العمل' : lang === 'en' ? 'Employer Connection' : 'Arbeitgeber-Verbindung'}</SectionHeader>
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col gap-3">
                    {currentUser.employerId ? (
                      <div>
                        <p className="text-sm font-semibold text-purple-900">
                          {lang === 'ar' ? 'تم الربط مع صاحب العمل' : lang === 'en' ? 'Linked with Employer' : 'Verbunden mit Arbeitgeber'}
                        </p>
                        <p className="text-xs text-purple-600 mb-3">
                          {lang === 'ar' ? 'صاحب العمل يمكنه الاطلاع على ساعات عملك وطباعتها.' : lang === 'en' ? 'Your employer can view and print your tracked hours.' : 'Ihr Arbeitgeber kann Ihre aufgezeichneten Stunden einsehen und drucken.'}
                        </p>
                        <Button variant="danger" onClick={handleUnlinkEmployer} disabled={linkingEmployerState} className="w-full justify-center">
                          {linkingEmployerState ? '…' : (lang === 'ar' ? 'إلغاء الربط' : lang === 'en' ? 'Disconnect' : 'Verbindung trennen')}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-purple-600 mb-2">
                          {lang === 'ar' ? 'أدخل رمز صاحب العمل الخاص بك لربط الحساب ومشاركة الساعات معه.' : lang === 'en' ? 'Enter your employer\'s code to link accounts and share tracked hours.' : 'Geben Sie den Code Ihres Arbeitgebers ein, um Konten zu verknüpfen.'}
                        </p>
                        <input
                          type="text"
                          placeholder={lang === 'ar' ? 'رمز صاحب العمل (مثال: EMP-XXXXXX)' : lang === 'en' ? 'Employer Code (e.g. EMP-123456)' : 'Arbeitgeber-Code (z.B. EMP-123456)'}
                          value={employerCodeInput}
                          onChange={e => setEmployerCodeInput(e.target.value)}
                          className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm text-purple-900 outline-none focus:border-purple-500"
                        />
                        <Button variant="primary" onClick={handleLinkEmployer} disabled={linkingEmployerState || !employerCodeInput.trim()} className="w-full justify-center">
                          {linkingEmployerState ? '…' : (lang === 'ar' ? 'ربط الحساب' : lang === 'en' ? 'Link Account' : 'Konto verknüpfen')}
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {currentUser.role === 'EMPLOYER' && (
                <>
                  <Divider />
                  <SectionHeader>{lang === 'ar' ? 'رمز مشاركة العمال' : lang === 'en' ? 'Employer Share Code' : 'Arbeitgeber-Freigabecode'}</SectionHeader>
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col gap-2">
                    <p className="text-xs text-purple-600">
                      {lang === 'ar' ? 'شارك هذا الرمز مع عمالك ليرتبطوا بحسابك وتتمكن من رؤية ساعاتهم:' : lang === 'en' ? 'Share this code with your workers to link them to your account:' : 'Teilen Sie diesen Code mit Ihren Mitarbeitern, um sie zu verknüpfen:'}
                    </p>
                    <div className="flex items-center gap-2 bg-white border border-purple-200 rounded-xl p-3 justify-between">
                      <span className="font-mono font-bold text-lg text-purple-900 select-all">{currentUser.employerCode}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(currentUser.employerCode);
                          toast.success(lang === 'ar' ? 'تم نسخ الرمز!' : 'Copied!');
                        }}
                        className="text-xs text-purple-600 hover:text-purple-900 font-bold cursor-pointer"
                      >
                        {lang === 'ar' ? 'نسخ' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Tab 2: Areas / Sites */}
        <div style={{ display: activeSubTab === 'areas' ? 'block' : 'none' }} className="space-y-4">
          <SectionHeader>{t.sites}</SectionHeader>
          {areas.map((a, i) => {
            const name = typeof a === 'string' ? a : (a.name || '');
            const start = typeof a === 'string' ? '' : (a.start || '');
            const end = typeof a === 'string' ? '' : (a.end || '');
            return (
            <div key={i} className="flex gap-2 mb-2 items-center bg-white p-2 rounded-xl border border-purple-100 shadow-sm">
              <input className={LI_INP + " flex-1 !bg-transparent !border-0 !p-0"} value={name}
                onChange={e => {
                  const newAreas = [...areas];
                  newAreas[i] = typeof a === 'string' ? {name: e.target.value} : {...a, name: e.target.value};
                  setAreas(newAreas);
                }} />
              <input type="time" className="w-24 h-8 bg-purple-50/60 border border-purple-100/80 rounded-xl px-2 text-xs text-center text-purple-900 outline-none focus:border-purple-300 focus:bg-purple-100/80 transition-all" value={start}
                onChange={e => {
                  const newAreas = [...areas];
                  newAreas[i] = typeof a === 'string' ? {name: a, start: e.target.value} : {...a, start: e.target.value};
                  setAreas(newAreas);
                }} />
              <input type="time" className="w-24 h-8 bg-purple-50/60 border border-purple-100/80 rounded-xl px-2 text-xs text-center text-purple-900 outline-none focus:border-purple-300 focus:bg-purple-100/80 transition-all" value={end}
                onChange={e => {
                  const newAreas = [...areas];
                  newAreas[i] = typeof a === 'string' ? {name: a, end: e.target.value} : {...a, end: e.target.value};
                  setAreas(newAreas);
                }} />
              <button onClick={() => removeArea(i)} className={LI_DEL}>×</button>
            </div>
          )})}
          <div className="flex gap-2 mt-1 items-center bg-purple-50 p-2 rounded-xl border border-purple-200 shadow-inner">
            <input className={LI_INP + " flex-1 !bg-transparent !border-0 !p-0"} value={newArea.name || (typeof newArea==='string'?newArea:'')} placeholder="Neuer Standort…"
              onChange={e => setNewArea(typeof newArea === 'string' ? {name: e.target.value} : {...newArea, name: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && addArea()} />
            <input type="time" className="w-24 h-8 bg-white border border-purple-200/80 rounded-xl px-2 text-xs text-center text-purple-900 outline-none focus:border-purple-400 transition-all" value={newArea.start || ''}
              onChange={e => setNewArea(typeof newArea === 'string' ? {name: newArea, start: e.target.value} : {...newArea, start: e.target.value})} />
            <input type="time" className="w-24 h-8 bg-white border border-purple-200/80 rounded-xl px-2 text-xs text-center text-purple-900 outline-none focus:border-purple-400 transition-all" value={newArea.end || ''}
              onChange={e => setNewArea(typeof newArea === 'string' ? {name: newArea, end: e.target.value} : {...newArea, end: e.target.value})} />
            <Button variant="primary" onClick={addArea} className="!px-3 !py-2 !text-xs shrink-0">+ {t.add}</Button>
          </div>
        </div>

        {/* Tab 3: Activities */}
        <div style={{ display: activeSubTab === 'acts' ? 'block' : 'none' }} className="space-y-4">
          <SectionHeader>{t.activities}</SectionHeader>
          {acts.map((a, i) => (
            <div key={i} className={LI_CLS}>
              <input className={LI_INP} value={a}
                onChange={e => setActs(acts.map((x, j) => j === i ? e.target.value : x))} />
              <button onClick={() => removeAct(i)} className={LI_DEL}>×</button>
            </div>
          ))}
          <div className="flex gap-2 mt-1">
            <input className={LI_INP} value={newAct} placeholder="Neue Tätigkeit…"
              onChange={e => setNewAct(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addAct()} />
            <Button variant="primary" onClick={addAct} className="!px-3 !py-2 !text-xs shrink-0">+ {t.add}</Button>
          </div>
        </div>

        {/* Tab 4: Signature Pad */}
        <div style={{ display: activeSubTab === 'sig' ? 'block' : 'none' }} className="space-y-4">
          <SectionHeader>{t.signature}</SectionHeader>
          <div className="border border-purple-200 rounded-xl overflow-hidden">
            <div className="bg-purple-50 px-3 py-2 flex justify-between items-center">
              <span className="text-xs font-semibold text-purple-600">{t.drawSig || 'Zeichnen Sie Ihre Unterschrift'}</span>
              <div className="flex gap-2">
                <button onClick={clearSig}
                  className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-red-200">
                  {t.clearSig || 'Löschen'}
                </button>
                <button onClick={saveLocalSig}
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-blue-200">
                  {t.save || 'Speichern'}
                </button>
              </div>
            </div>
            
            {settings.signature && (
              <div className="p-3 bg-white flex justify-center border-b border-purple-100">
                <img src={settings.signature} alt="Gespeicherte Unterschrift" className="h-16 object-contain" />
              </div>
            )}

            <canvas ref={canvasRef}
              className="block w-full bg-white cursor-crosshair touch-none"
              style={{ height: 90 }} />
          </div>

          <div className="mt-3 p-4 bg-purple-50 rounded-xl border border-purple-200 text-center flex flex-col items-center relative overflow-hidden">
            {currentUser && currentUser.plan?.toLowerCase() !== 'pro' ? (
              <div className="absolute inset-0 bg-white/85 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 p-3">
                <span className="text-[18px] mb-0.5">👑</span>
                <p className="text-[11px] font-bold text-purple-900 mb-2">
                  {lang==='ar'?'التوقيع الإلكتروني عبر الجوال متوفر في PRO':'Mobile signature sync is a PRO feature'}
                </p>
                <button onClick={() => startCheckout('pro')} className="bg-purple-600 hover:bg-purple-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm cursor-pointer transition-all">
                  {lang==='ar'?'ترقية الآن':'Upgrade to PRO'}
                </button>
              </div>
            ) : null}

            {/* Real-time Status Badge */}
            {isWaitingSig && (
              <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-full text-[9px] font-bold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {lang==='ar' ? 'بث مباشر نشط' : lang==='en' ? 'LIVE SIGNAL' : 'LIVE STREAM'}
              </div>
            )}

            <button onClick={() => {
              if (currentUser) {
                toast.success('Prüfe auf neue Unterschrift...');
                useAppStore.getState().loadFromCloud();
              } else {
                toast.error(lang==='ar'?'يتطلب حساب سحابي لتحديث السحابة':'Requires cloud account for sync')
              }
            }} className="absolute top-2 right-2 text-xs bg-white border border-purple-200 text-purple-600 px-2 py-1 rounded shadow-sm hover:bg-purple-100">
              ↻ {lang==='ar'?'تحديث':lang==='en'?'Refresh':'Aktualisieren'}
            </button>
            
            <p className="text-xs text-purple-800 font-medium mb-3 mt-2">
              {lang==='ar'?'امسح رمز الـ QR بجوالك للتوقيع الفوري والمباشر:':lang==='en'?'Scan this QR code to beam your signature in real-time:':'Scannen Sie diesen QR-Code für eine sofortige Übertragung:'}
            </p>
            <div className="bg-white p-2 rounded-xl shadow-sm inline-block relative">
              <QRCodeSVG value={directSignUrl} size={120} level="M" />
            </div>
            <p className="text-[9px] text-purple-400 mt-2 font-medium">
              {lang==='ar'?'يتم الإرسال لحظياً بدون تخزين سحابي':'Transferred instantly without cloud storage'}
            </p>
          </div>
        </div>

      </div>

      {/* Footer Buttons matching reference perfectly */}
      <div className="flex gap-2 p-5 pt-0 border-t-0 shrink-0">
        <Button variant="ghost" onClick={onBack} className="flex-1 justify-center">{t.back}</Button>
        <Button variant="primary" onClick={onBack} className="flex-1 justify-center">{t.save}</Button>
      </div>
    </div>
  )
}
