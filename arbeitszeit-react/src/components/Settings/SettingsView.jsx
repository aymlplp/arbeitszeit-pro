// src/components/Settings/SettingsView.jsx
import { useEffect, useRef, useState } from 'react'
import useAppStore from '@/store/useAppStore'
import { Button, SectionHeader, Divider } from '@/components/UI'
import { changePassword, startCheckout, openBillingPortal, getAccessToken } from '@/lib/auth'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'

export default function SettingsView({ t, onBack }) {
  const { settings, updateSettings, areas, setAreas, acts, setActs, currentUser } = useAppStore()
  const canvasRef = useRef(null)
  const sigCtxRef = useRef(null)
  const drawingRef = useRef(false)
  const [newArea, setNewArea] = useState({name:'', start:'', end:''})
  const [newAct,  setNewAct]  = useState('')
  const [pw, setPw] = useState({ cur: '', new: '' })
  const [saving, setSaving] = useState(false)

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
  }

  const saveLocalSig = () => {
    const c = canvasRef.current
    if (c) {
      updateSettings({ signature: c.toDataURL('image/png') })
      toast.success(t.save ? t.save + '!' : 'Unterschrift gespeichert!')
    }
  }

  const mobileSignUrl = currentUser ? `${window.location.origin}/?mobileSignToken=${getAccessToken()}` : ''

  const addArea = () => {
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

  const LI_CLS = 'flex items-center gap-2 mb-2'
  const LI_INP = 'flex-1 bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm text-purple-900 outline-none focus:border-purple-500'
  const LI_DEL = 'w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-100 transition-all cursor-pointer shrink-0 text-sm'

  return (
    <div className="glass-light rounded-2xl p-5 space-y-4">
      {/* Personal data */}
      <SectionHeader>{t.personalData}</SectionHeader>
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'name',  label: t.name,    type: 'text',  ph: 'Ayman Ali' },
          { key: 'co',    label: t.company, type: 'text',  ph: 'Firma GmbH' },
          { key: 'email', label: t.email,   type: 'email', ph: 'email@firma.de' },
          { key: 'phone', label: t.phone,   type: 'tel',   ph: '+43 ...' },
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

      <Divider />

      {/* Signature */}
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

      {currentUser && (
        <div className="mt-3 p-4 bg-purple-50 rounded-xl border border-purple-200 text-center flex flex-col items-center relative">
          <button onClick={() => {
            toast.success('Prüfe auf neue Unterschrift...');
            useAppStore.getState().loadFromCloud();
          }} className="absolute top-2 right-2 text-xs bg-white border border-purple-200 text-purple-600 px-2 py-1 rounded shadow-sm hover:bg-purple-100">
            ↻ Aktualisieren
          </button>
          <p className="text-xs text-purple-800 font-medium mb-3">Oder scannen Sie diesen QR-Code mit dem Handy, um auf dem Smartphone zu unterschreiben:</p>
          <div className="bg-white p-2 rounded-xl shadow-sm inline-block">
            <QRCodeSVG value={mobileSignUrl} size={120} level="M" />
          </div>
        </div>
      )}

      <Divider />

      {/* Sites */}
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
          <input type="time" className={LI_INP + " w-24 !bg-transparent !border-0 !p-0 text-xs text-center"} value={start}
            onChange={e => {
              const newAreas = [...areas];
              newAreas[i] = typeof a === 'string' ? {name: a, start: e.target.value} : {...a, start: e.target.value};
              setAreas(newAreas);
            }} />
          <input type="time" className={LI_INP + " w-24 !bg-transparent !border-0 !p-0 text-xs text-center"} value={end}
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
        <input type="time" className={LI_INP + " w-24 !bg-transparent !border-0 !p-0 text-xs text-center"} value={newArea.start || ''}
          onChange={e => setNewArea(typeof newArea === 'string' ? {name: newArea, start: e.target.value} : {...newArea, start: e.target.value})} />
        <input type="time" className={LI_INP + " w-24 !bg-transparent !border-0 !p-0 text-xs text-center"} value={newArea.end || ''}
          onChange={e => setNewArea(typeof newArea === 'string' ? {name: newArea, end: e.target.value} : {...newArea, end: e.target.value})} />
        <Button variant="primary" onClick={() => {
          const val = typeof newArea === 'string' ? {name: newArea} : newArea;
          if(!val.name) return;
          setAreas([...areas, val]);
          setNewArea({name:'', start:'', end:''});
        }} className="!px-3 !py-2 !text-xs shrink-0">+ {t.add}</Button>
      </div>

      <Divider />

      {/* Activities */}
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

      {currentUser && (
        <>
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
                <p className="text-xs text-purple-600">{currentUser.plan === 'pro' ? 'Pro Version (Aktiv)' : 'Kostenlose Version'}</p>
              </div>
            </div>
            {currentUser.plan !== 'pro' ? (
              <Button variant="primary" onClick={() => startCheckout('pro')} className="w-full justify-center">
                Auf Pro upgraden
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => openBillingPortal()} className="w-full justify-center border border-purple-200">
                Kundenportal öffnen
              </Button>
            )}
          </div>
        </>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="ghost" onClick={onBack} className="flex-1 justify-center">{t.back}</Button>
        <Button variant="primary" onClick={onBack} className="flex-1 justify-center">{t.save}</Button>
      </div>
    </div>
  )
}
