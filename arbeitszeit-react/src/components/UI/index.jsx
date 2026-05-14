// src/components/UI/index.jsx
import { motion, AnimatePresence } from 'framer-motion'

// ── Button ──────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', className = '', onClick, disabled, type = 'button', ...props }) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-semibold rounded-full transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none'
  const variants = {
    primary: 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-900 px-4 py-2 text-sm',
    ghost:   'bg-white/70 text-purple-700 border border-purple-200 hover:bg-white/90 px-4 py-2 text-sm',
    pink:    'bg-pink-500 text-white shadow-md shadow-pink-500/40 hover:bg-pink-600 px-4 py-2 text-sm',
    dark:    'bg-purple-900 text-white hover:bg-purple-800 px-4 py-2 text-sm',
    danger:  'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-4 py-2 text-sm',
    icon:    'w-8 h-8 bg-white/60 border border-purple-200 text-purple-600 hover:bg-white/90 text-base',
    sm:      'bg-purple-600 text-white px-3 py-1.5 text-xs shadow-sm shadow-purple-500/25 hover:bg-purple-800',
    smGhost: 'bg-white/70 text-purple-700 border border-purple-200 hover:bg-white/90 px-3 py-1.5 text-xs',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  )
}

// ── Input ───────────────────────────────────────────────────────
export function Input({ label, className = '', ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-semibold text-purple-600/70 mb-1">{label}</label>}
      <input
        className={`w-full bg-white/60 border border-purple-200 rounded-xl px-3 py-2 text-sm text-purple-900 outline-none transition-all focus:border-purple-500 focus:bg-white/90 placeholder-purple-400/40 ${className}`}
        {...props}
      />
    </div>
  )
}

// ── Select ──────────────────────────────────────────────────────
export function Select({ label, children, className = '', ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-semibold text-purple-600/70 mb-1">{label}</label>}
      <select
        className={`w-full bg-white/60 border border-purple-200 rounded-xl px-3 py-2 text-sm text-purple-900 outline-none focus:border-purple-500 ${className}`}
        {...props}>
        {children}
      </select>
    </div>
  )
}

// ── Modal ───────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose?.()}>
          <div className="absolute inset-0 bg-purple-900/40 backdrop-blur-sm" />
          <motion.div
            className={`relative bg-white rounded-2xl shadow-2xl shadow-purple-900/25 p-6 w-full ${maxWidth} max-h-[88vh] overflow-y-auto z-10`}
            initial={{ scale: 0.94, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
            {title && (
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-purple-900">{title}</h2>
                <button onClick={onClose}
                  className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center text-purple-400 hover:bg-purple-100 hover:text-purple-600 transition-all text-sm">
                  ✕
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Divider ─────────────────────────────────────────────────────
export function Divider({ className = '' }) {
  return <hr className={`border-purple-100 my-4 ${className}`} />
}

// ── Section Header ───────────────────────────────────────────────
export function SectionHeader({ children }) {
  return (
    <div className="text-xs font-bold tracking-widest text-purple-600 uppercase px-2.5 py-1.5 bg-purple-50 rounded-lg mb-3">
      {children}
    </div>
  )
}

// ── Day Type Badge ───────────────────────────────────────────────
const TYPE_STYLES = {
  work:     'bg-green-50 text-green-800',
  sick:     'bg-red-50 text-red-800',
  holiday:  'bg-blue-50 text-blue-800',
  vacation: 'bg-indigo-50 text-indigo-800',
}

export function DayTypeBadge({ type, label }) {
  return (
    <span className={`text-[10px] font-extrabold tracking-wide px-3 py-1 rounded-full ${TYPE_STYLES[type] || TYPE_STYLES.work}`}>
      {label}
    </span>
  )
}

// ── Plan Badge ───────────────────────────────────────────────────
export function PlanBadge({ plan }) {
  const s = plan === 'free'
    ? 'bg-purple-100 text-purple-700'
    : 'bg-green-100 text-green-700'
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${s}`}>
      {plan?.toUpperCase()}
    </span>
  )
}

// ── Pill counter ─────────────────────────────────────────────────
export function Pill({ label, value }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-[13px] text-white/85">
      {label}
      <span className="bg-white/20 rounded-full px-2 py-0.5 text-white font-bold text-[12px]">{value}</span>
    </div>
  )
}

// ── Summary box ──────────────────────────────────────────────────
export function SumBox({ label, value, sub, highlight }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-gradient-to-br from-pink-500 to-pink-700' : 'bg-white/8'}`}
      style={highlight ? {} : { background: 'rgba(255,255,255,.08)' }}>
      <div className="text-[9px] font-bold tracking-widest uppercase opacity-60 mb-1.5">{label}</div>
      <div className="text-lg font-extrabold mb-0.5">{value}</div>
      <div className="text-[10px] opacity-55">{sub}</div>
    </div>
  )
}

// ── Loading spinner ──────────────────────────────────────────────
export function Spinner({ size = 6 }) {
  return (
    <div className={`w-${size} h-${size} border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin`} />
  )
}

// ── Nav circle button ─────────────────────────────────────────────
export function NavCircle({ children, onClick }) {
  return (
    <button onClick={onClick}
      className="w-8 h-8 rounded-full flex items-center justify-center bg-white/60 border border-purple-200 text-purple-600 hover:bg-white/90 transition-all text-base leading-none cursor-pointer">
      {children}
    </button>
  )
}
