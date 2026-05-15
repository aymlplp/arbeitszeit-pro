import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/UI'
import useAppStore from '@/store/useAppStore'
import toast from 'react-hot-toast'

export default function MobileSignView({ topic }) {
  const { updateSettings, lang } = useAppStore()
  const canvasRef = useRef(null)
  const sigCtxRef = useRef(null)
  const drawingRef = useRef(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || sigCtxRef.current) return
    
    canvas.width = window.innerWidth - 40
    canvas.height = 300
    
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#1e1854'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    sigCtxRef.current = ctx

    const getPos = (e) => {
      const r = canvas.getBoundingClientRect()
      const src = e.touches ? e.touches[0] : e
      return { x: src.clientX - r.left, y: src.clientY - r.top }
    }
    const start = e => { drawingRef.current = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y) }
    const move  = e => { if (!drawingRef.current) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke() }
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

  const saveSig = async () => {
    setSaving(true)
    try {
      const c = canvasRef.current
      const base64 = c.toDataURL('image/png')
      
      // Update local state
      updateSettings({ signature: base64 })
      
      // Real-time EPHEMERAL STREAMING CHANNEL (Serverless)
      if (topic) {
        const blob = await new Promise(resolve => c.toBlob(resolve, 'image/png'))
        await fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          body: blob,
          headers: {
            'Filename': 'sig.png',
            'Title': 'Real-Time Mobile Signature Sync'
          }
        })
      }
      
      // Standard Cloud Persistence fallback
      const state = useAppStore.getState()
      if (state.currentUser) {
        const { saveYearData } = await import('@/lib/auth')
        await saveYearData(state.aYear, state.aData, state.settings)
      }
      
      toast.success(lang === 'ar' ? 'تم إرسال التوقيع بنجاح!' : lang === 'en' ? 'Signature sent successfully!' : 'Unterschrift gespeichert!')
      setDone(true)
    } catch(e) {
      console.error(e)
      toast.error(lang === 'ar' ? 'فشل في الحفظ' : 'Fehler beim Speichern')
    }
    setSaving(false)
  }

  const t = {
    title:    lang==='ar'?'التوقيع الإلكتروني':lang==='en'?'E-Signature':'Unterschrift',
    clear:    lang==='ar'?'مسح':lang==='en'?'Clear':'Löschen',
    send:     lang==='ar'?'إرسال':lang==='en'?'Send':'Senden',
    successTitle: lang==='ar'?'تم بنجاح!':lang==='en'?'Success!':'Erfolgreich!',
    successDesc: lang==='ar'?'تم نقل التوقيع إلى المتصفح بنجاح. يمكنك الآن إغلاق هذا التبويب.':lang==='en'?'The signature was beamed to your desktop. You can now close this window.':'Die Unterschrift wurde an das Programm übertragen. Sie können dieses Fenster nun schließen.'
  }

  if (done) {
    return (
      <div dir={lang==='ar'?'rtl':'ltr'} className="flex flex-col items-center justify-center min-h-screen p-6 text-center" style={{background:'linear-gradient(135deg,#e8e0f5,#d4c8f0)'}}>
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-purple-900 mb-2">{t.successTitle}</h2>
        <p className="text-purple-700">{t.successDesc}</p>
      </div>
    )
  }

  return (
    <div dir={lang==='ar'?'rtl':'ltr'} className="flex flex-col min-h-screen p-5" style={{background:'linear-gradient(135deg,#e8e0f5,#d4c8f0)'}}>
      <h2 className="text-xl font-bold text-purple-900 mb-4 text-center">{t.title}</h2>
      
      <div className="bg-white rounded-2xl shadow-lg border border-purple-200 overflow-hidden mb-6 flex-1 max-h-[400px]">
        <canvas ref={canvasRef} className="block w-full h-full bg-white cursor-crosshair touch-none" />
      </div>

      <div className="flex gap-3 mt-auto mb-8">
        <Button variant="ghost" onClick={clearSig} className="flex-1 justify-center bg-white">{t.clear}</Button>
        <Button variant="primary" onClick={saveSig} disabled={saving} className="flex-1 justify-center">
          {saving ? '...' : t.send}
        </Button>
      </div>
    </div>
  )
}
