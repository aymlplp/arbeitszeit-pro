// src/components/Auth/AuthFlow.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { login, register, verifyEmail, resendCode, forgotPassword } from '@/lib/auth'
import toast from 'react-hot-toast'

const CARD = 'bg-white rounded-2xl shadow-2xl shadow-purple-900/20 p-7 w-full max-w-sm'
const INP  = 'w-full bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 text-sm text-purple-900 outline-none focus:border-purple-500 focus:bg-white transition-all placeholder-purple-400/50'
const BTN  = 'w-full bg-purple-600 text-white font-bold rounded-full py-3 text-sm hover:bg-purple-900 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
const GHOST = 'w-full bg-white text-purple-700 font-semibold rounded-full py-3 text-sm border border-purple-200 hover:bg-purple-50 transition-all cursor-pointer'

export default function AuthFlow({ onSuccess }) {
  const [screen,  setScreen]  = useState('login')   // login | register | verify | forgot
  const [loading, setLoading] = useState(false)
  const [userId,  setUserId]  = useState(null)
  const [code,    setCode]    = useState(['','','','','',''])

  // Form state
  const [form, setForm] = useState({ name: '', email: '', password: '', plan: 'free' })
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const wrap = async (fn) => {
    setLoading(true)
    try { await fn() } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const doLogin = () => wrap(async () => {
    const user = await login(form.email, form.password)
    if (user?.needsVerification) { setUserId(user.userId); setScreen('verify'); return }
    onSuccess(user)
  })

  const doRegister = () => wrap(async () => {
    if (!form.name || !form.email || !form.password) throw new Error('Alle Felder erforderlich')
    const d = await register(form.name, form.email, form.password, form.plan)
    toast.success('Konto erfolgreich erstellt!')
    onSuccess(d.user)
  })

  const doVerify = () => wrap(async () => {
    const c = code.join('')
    if (c.length < 6) throw new Error('Bitte alle 6 Ziffern eingeben')
    const user = await verifyEmail(userId, c)
    toast.success('Konto aktiviert!')
    onSuccess(user)
  })

  const doForgot = () => wrap(async () => {
    await forgotPassword(form.email)
    toast.success('Falls diese E-Mail existiert, wurde ein Link gesendet.')
    setScreen('login')
  })

  const doResend = () => wrap(async () => {
    await resendCode(userId)
    toast.success('Code erneut gesendet!')
  })

  const codeInput = (i, val) => {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...code]; next[i] = v; setCode(next)
    if (v && i < 5) document.getElementById(`c${i+1}`)?.focus()
  }
  const codeKey = (e, i) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) document.getElementById(`c${i-1}`)?.focus()
  }

  const ANIM = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: -20 },
    transition: { duration: 0.18 },
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-app-gradient"
      style={{ background: 'linear-gradient(135deg,#e8e0f5,#d4c8f0,#c9b8e8,#e0c8e8)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-900 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-purple-500/40 mb-3">
            ⏱
          </div>
          <div className="text-xl font-extrabold text-purple-900">Arbeitszeit Pro</div>
          <div className="text-sm text-purple-500/70 mt-1">Professionelle Zeiterfassung</div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── LOGIN ── */}
          {screen === 'login' && (
            <motion.div key="login" {...ANIM} className={CARD}>
              <div className="text-base font-bold text-purple-900 mb-5">Willkommen zurück</div>
              <div className="space-y-3 mb-4">
                <input type="email" placeholder="E-Mail" value={form.email}
                  onChange={e => setF('email', e.target.value)} className={INP}
                  onKeyDown={e => e.key === 'Enter' && doLogin()} />
                <input type="password" placeholder="Passwort" value={form.password}
                  onChange={e => setF('password', e.target.value)} className={INP}
                  onKeyDown={e => e.key === 'Enter' && doLogin()} />
              </div>
              <button onClick={doLogin} disabled={loading} className={BTN}>
                {loading ? '…' : 'Anmelden →'}
              </button>
              <div className="flex justify-between mt-4">
                <button onClick={() => setScreen('register')} className="text-xs text-purple-500 hover:text-purple-700 cursor-pointer">
                  Konto erstellen
                </button>
                <button onClick={() => setScreen('forgot')} className="text-xs text-purple-500 hover:text-purple-700 cursor-pointer">
                  Passwort vergessen?
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-purple-100">
                <button onClick={() => onSuccess(null)}
                  className="w-full text-xs text-purple-400 hover:text-purple-600 cursor-pointer">
                  Offline nutzen (ohne Konto) →
                </button>
              </div>
            </motion.div>
          )}

          {/* ── REGISTER ── */}
          {screen === 'register' && (
            <motion.div key="register" {...ANIM} className={CARD}>
              <div className="text-base font-bold text-purple-900 mb-1">Konto erstellen</div>
              <div className="text-xs text-purple-500 mb-5">14 Tage kostenlos — keine Kreditkarte</div>
              <div className="space-y-3 mb-3">
                <input type="text" placeholder="Vollständiger Name" value={form.name}
                  onChange={e => setF('name', e.target.value)} className={INP} />
                <input type="email" placeholder="E-Mail" value={form.email}
                  onChange={e => setF('email', e.target.value)} className={INP} />
                <input type="password" placeholder="Passwort (Min. 8 Zeichen, 1 Großbuchstabe, 1 Zahl)" value={form.password}
                  onChange={e => setF('password', e.target.value)} className={INP} />
                <div className="grid grid-cols-2 gap-2">
                  {[{ v: 'free', l: 'Free (0€)' }, { v: 'pro', l: 'Pro (4,99€/Mo)' }].map(p => (
                    <button key={p.v} onClick={() => setF('plan', p.v)}
                      className={`text-xs py-2 px-3 rounded-xl border font-semibold transition-all cursor-pointer
                        ${form.plan === p.v ? 'bg-purple-600 text-white border-transparent' : 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-400'}`}>
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={doRegister} disabled={loading} className={BTN}>
                {loading ? '…' : 'Konto erstellen →'}
              </button>
              <button onClick={() => setScreen('login')} className={`${GHOST} mt-2`}>← Zurück</button>
            </motion.div>
          )}

          {/* ── VERIFY ── */}
          {screen === 'verify' && (
            <motion.div key="verify" {...ANIM} className={CARD}>
              <div className="text-center mb-5">
                <div className="text-3xl mb-2">📧</div>
                <div className="text-base font-bold text-purple-900">E-Mail bestätigen</div>
                <div className="text-xs text-purple-500 mt-1">6-stelligen Code aus der E-Mail eingeben</div>
              </div>
              <div className="flex gap-2 justify-center mb-5">
                {code.map((v, i) => (
                  <input key={i} id={`c${i}`}
                    type="number" inputMode="numeric" maxLength={1} value={v}
                    onChange={e => codeInput(i, e.target.value)}
                    onKeyDown={e => codeKey(e, i)}
                    className="w-10 h-12 text-center text-xl font-bold bg-purple-50 border-2 border-purple-200 rounded-xl outline-none focus:border-purple-600 transition-all"
                  />
                ))}
              </div>
              <button onClick={doVerify} disabled={loading} className={BTN}>
                {loading ? '…' : 'Bestätigen ✓'}
              </button>
              <button onClick={doResend} disabled={loading} className={`${GHOST} mt-2 text-xs`}>
                Code erneut senden
              </button>
            </motion.div>
          )}

          {/* ── FORGOT ── */}
          {screen === 'forgot' && (
            <motion.div key="forgot" {...ANIM} className={CARD}>
              <div className="text-base font-bold text-purple-900 mb-1">Passwort vergessen</div>
              <div className="text-xs text-purple-500 mb-5">Wir senden Ihnen einen Reset-Link</div>
              <input type="email" placeholder="Ihre E-Mail" value={form.email}
                onChange={e => setF('email', e.target.value)} className={`${INP} mb-4`} />
              <button onClick={doForgot} disabled={loading} className={BTN}>
                {loading ? '…' : 'Reset-Link senden →'}
              </button>
              <button onClick={() => setScreen('login')} className={`${GHOST} mt-2`}>← Zurück</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
