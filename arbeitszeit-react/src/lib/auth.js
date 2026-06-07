// src/lib/auth.js — Backend API client (JWT + Refresh rotation)

const API = import.meta.env.VITE_API_URL || '/api';

let _accessToken = null
let _refreshTimer = null

// ── CSRF ───────────────────────────────────────────────────────
async function getCsrf() {
  return null // disabled for now
}

// ── Core request ───────────────────────────────────────────────
async function request(method, path, body = null, withAuth = false) {
  const headers = { 'Content-Type': 'application/json' }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers['x-csrf-token'] = await getCsrf()
  }
  if (withAuth && _accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    credentials: 'include',
    cache: 'no-store',
    body: body ? JSON.stringify(body) : undefined,
  })

  // Auto-refresh on TOKEN_EXPIRED
  if (res.status === 401 && withAuth) {
    const data = await res.json().catch(() => ({}))
    if (data.code === 'TOKEN_EXPIRED') {
      const ok = await refreshToken()
      if (ok) {
        headers['Authorization'] = `Bearer ${_accessToken}`
        return fetch(`${API}${path}`, {
          method, headers, credentials: 'include',
          body: body ? JSON.stringify(body) : undefined,
        })
      }
    }
  }

  return res
}

// ── Token helpers ──────────────────────────────────────────────
export function setAuthToken(token) {
  _accessToken = token
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const ms = payload.exp * 1000 - Date.now() - 30_000
    if (ms > 0) {
      clearTimeout(_refreshTimer)
      _refreshTimer = setTimeout(refreshToken, ms)
    }
  } catch {}
}

function clearToken() {
  _accessToken = null
  clearTimeout(_refreshTimer)
}

export function getAccessToken() { return _accessToken }

// ── Auth methods ───────────────────────────────────────────────
export async function authInit() {
  const ok = await refreshToken()
  if (!ok) return null
  return me()
}

export async function refreshToken() {
  try {
    const res  = await fetch(`${API}/auth/refresh`, { method: 'POST', credentials: 'include' })
    const data = await res.json()
    if (!res.ok) { clearToken(); return false }
    setAuthToken(data.accessToken)
    return true
  } catch {
    clearToken()
    return false
  }
}

export async function login(email, password) {
  const res  = await request('POST', '/auth/login', { email, password })
  const data = await res.json()
  if (!res.ok) {
    if (data.code === 'UNVERIFIED') return { needsVerification: true, userId: data.userId }
    throw new Error(data.error || 'Login failed')
  }
  setAuthToken(data.accessToken)
  return data.user
}

export async function register(name, email, password, plan = 'free', role = 'USER') {
  const res  = await request('POST', '/auth/register', { name, email, password, plan, role })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Registration failed')
  setAuthToken(data.accessToken)
  return data
}

export async function verifyEmail(userId, code) {
  const res  = await request('POST', '/auth/verify-email', { userId, code })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Verification failed')
  setAuthToken(data.accessToken)
  return data.user
}

export async function resendCode(userId) {
  const res  = await request('POST', '/auth/resend-code', { userId })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data
}

export async function logout() {
  try { await request('POST', '/auth/logout', null, true) } finally { clearToken() }
}

export async function forgotPassword(email) {
  const res = await request('POST', '/auth/forgot-password', { email })
  return res.json()
}

export async function resetPassword(token, password) {
  const res  = await request('POST', '/auth/reset-password', { token, password })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data
}

export async function changePassword(currentPassword, newPassword) {
  const res  = await request('POST', '/auth/change-password', { currentPassword, newPassword }, true)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data
}

export async function me() {
  const res  = await request('GET', '/auth/me', null, true)
  const data = await res.json()
  return res.ok ? data.user : null
}

// ── Data API ───────────────────────────────────────────────────
export async function getYearData(year) {
  const res  = await request('GET', `/data/${year}`, null, true)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data
}

export async function saveYearData(year, data, settings) {
  const res = await request('POST', `/data/${year}`, { data, settings }, true)
  const d   = await res.json()
  if (!res.ok) throw new Error(d.error)
  return d
}

export async function listYears() {
  const res  = await request('GET', '/data', null, true)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data.years
}

// ── Stripe ─────────────────────────────────────────────────────
export async function startCheckout(plan) {
  const res  = await request('POST', '/stripe/checkout', { plan }, true)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  window.location.href = data.url
}

export async function openBillingPortal() {
  const res  = await request('POST', '/stripe/portal', null, true)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  window.location.href = data.url
}

export async function sendSupportRequest(name, email, phone, message) {
  const res  = await request('POST', '/auth/support', { name, email, phone, message }, false)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data
}

// ── Employer/Worker linking ─────────────────────────────────────
export async function linkEmployer(code) {
  const res  = await request('POST', '/auth/link-employer', { code }, true)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data
}

export async function unlinkEmployer() {
  const res  = await request('POST', '/auth/unlink-employer', null, true)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data
}

export async function getEmployerWorkers() {
  const res  = await request('GET', '/employer/workers', null, true)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data.workers
}

export async function getWorkerYears(workerId) {
  const res  = await request('GET', `/employer/workers/${workerId}/years`, null, true)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data.years
}

export async function getWorkerYearData(workerId, year) {
  const res  = await request('GET', `/employer/workers/${workerId}/year/${year}`, null, true)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error)
  return data
}
