// src/lib/utils.js
// ── Week ──────────────────────────────────────────────────────
export function getCurrentMonday() {
  const t = new Date(); t.setHours(0,0,0,0)
  const d = t.getDay(), diff = d===0?6:d-1
  t.setDate(t.getDate()-diff); return t
}
const BASE = getCurrentMonday()

export function getMondayByOffset(offset) {
  const d = new Date(BASE); d.setDate(BASE.getDate()+offset*7); return d
}
export function getWeekDates(offset) {
  const mon = getMondayByOffset(offset)
  return Array.from({length:7},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return d})
}
export function getISODate(date) { return date.toISOString().slice(0,10) }
export function getKW(date) {
  const u = new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()))
  u.setUTCDate(u.getUTCDate()+4-(u.getUTCDay()||7))
  return Math.ceil((((u-new Date(Date.UTC(u.getUTCFullYear(),0,1)))/864e5)+1)/7)
}

// ── Time ──────────────────────────────────────────────────────
export function timeToMins(str) {
  if (!str) return 0
  const m = str.match(/^(\d{1,2}):(\d{2})$/)
  return m ? +m[1]*60 + +m[2] : 0
}
export function minsToHHMM(mins) {
  if (!mins && mins!==0) return '0:00'
  const h = Math.floor(Math.abs(mins)/60), m = Math.round(Math.abs(mins)%60)
  return `${h}:${m<10?'0':''}${m}`
}
export function minsToStd(mins) { return `${(mins/60).toFixed(2)} Std` }
export function hoursToHHMM(h) { return minsToHHMM((parseFloat(h)||0)*60) }

// ── Format ────────────────────────────────────────────────────
export function formatDDMM(date) {
  return `${String(date.getDate()).padStart(2,'0')}.${String(date.getMonth()+1).padStart(2,'0')}.`
}
export function formatFull(date, monthNames) {
  return `${date.getDate()}. ${monthNames[date.getMonth()]} ${date.getFullYear()}`
}
export function formatEur(value) {
  return parseFloat((value||0).toFixed(2)).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})+' €'
}

// ── Entry / Day calculation ────────────────────────────────────
// pause and fahrt are stored as HOURS (float). 0.5 = 30 min
export function calcEntryMins(entry) {
  const m = timeToMins(entry.end) - timeToMins(entry.start)
  return m > 0 ? m : 0
}

export function calcDayTotals(entries = []) {
  return entries.reduce((acc, e) => {
    const m = calcEntryMins(e)
    if (m > 0) {
      acc.arb   += m
      // fahrt and pause stored as hours → convert to minutes
      acc.fahr  += (parseFloat(e.fahrt) || 0) * 60
      acc.pause += (parseFloat(e.pause) || 0) * 60
    }
    return acc
  }, { arb:0, fahr:0, pause:0 })
}

export function calcWeekTotals(weekDates, aData) {
  const totals = { arb:0, fahr:0, pause:0, workDays:0, sickDays:0, holidays:0, vacation:0 }
  weekDates.forEach(d => {
    const dd = aData[getISODate(d)]
    if (!dd) return
    const t = dd.type||'work'
    if      (t==='sick')     totals.sickDays++
    else if (t==='holiday')  totals.holidays++
    else if (t==='vacation') totals.vacation++
    else if (dd.entries?.length) totals.workDays++
    const day = calcDayTotals(dd.entries)
    totals.arb   += day.arb
    totals.fahr  += day.fahr
    totals.pause += day.pause
  })
  totals.net = totals.arb + totals.fahr - totals.pause
  return totals
}

export function calcSalary(period, aData, weekOffset, year) {
  let arb=0, fahr=0, pause=0
  const today = new Date()
  const sumEntries = entries => {
    const t = calcDayTotals(entries)
    arb+=t.arb; fahr+=t.fahr; pause+=t.pause
  }
  if (period==='week') {
    getWeekDates(weekOffset).forEach(d => sumEntries((aData[getISODate(d)]||{}).entries||[]))
  } else if (period==='month') {
    const base = new Date(today.getFullYear(), today.getMonth(), 1)
    Object.keys(aData).forEach(k => {
      const d = new Date(k)
      if (d.getFullYear()===base.getFullYear()&&d.getMonth()===base.getMonth())
        sumEntries(aData[k].entries||[])
    })
  } else {
    Object.keys(aData).forEach(k => {
      if (new Date(k).getFullYear()===year) sumEntries(aData[k].entries||[])
    })
  }
  const tot = arb+fahr-pause
  return { arb, fahr, pause, tot }
}
