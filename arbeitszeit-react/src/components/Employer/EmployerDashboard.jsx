import { useEffect, useState, useMemo } from 'react'
import { getEmployerWorkers, getWorkerYears, getWorkerYearData } from '@/lib/auth'
import { Button, SectionHeader, Divider, DayTypeBadge, Pill } from '@/components/UI'
import toast from 'react-hot-toast'
import { CalendarDays, FileSpreadsheet, Coins, LogOut, Printer, Users, ChevronLeft, ChevronRight, Award } from 'lucide-react'

// Translation vocabulary
const vocab = {
  ar: {
    dashboard: 'لوحة التحكم بصاحب العمل',
    inviteCode: 'رمز مشاركة العمال الخاص بك:',
    shareHelp: 'شارك هذا الرمز مع عمالك ليرتبطوا بحسابك:',
    noWorkers: 'لا يوجد عمال مرتبطين بحسابك بعد.',
    workers: 'قائمة العمال',
    selectWorker: 'يرجى اختيار عامل لعرض بياناته.',
    selectPeriod: 'الفترة',
    totalHours: 'إجمالي الساعات',
    driveTime: 'وقت القيادة',
    totalBreak: 'الاستراحات',
    netTime: 'الصافي',
    workDays: 'أيام العمل',
    sickDays: 'أيام المرض',
    vacationDays: 'الإجازة',
    holidays: 'العطل',
    hourlyRate: 'سعر الساعة',
    printReport: 'طباعة التقرير الشهري',
    printWeeklyReport: 'طباعة التقرير الأسبوعي',
    week: 'أسبوع',
    month: 'شهر',
    year: 'سنة',
    workerInfo: 'بيانات العامل',
    company: 'الشركة',
    name: 'الاسم',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    weeklyHours: 'ساعات العمل الأسبوعية',
    monthlyReport: 'التقرير الشهري',
    noData: 'لا توجد بيانات مسجلة.',
    copied: 'تم نسخ الرمز!',
    day: 'اليوم',
    area: 'المنطقة',
    start: 'البداية',
    end: 'النهاية',
    breakMin: 'استراحة (د)',
    driveMin: 'قيادة (د)',
    net: 'الصافي',
    salary: 'الراتب المستحق',
    weeklyReport: 'التقرير الأسبوعي'
  },
  en: {
    dashboard: 'Employer Dashboard',
    inviteCode: 'Your Worker Share Code:',
    shareHelp: 'Share this code with your workers to link them to your account:',
    noWorkers: 'No workers linked to your account yet.',
    workers: 'Workers List',
    selectWorker: 'Please select a worker to view their data.',
    selectPeriod: 'Period',
    totalHours: 'Total Hours',
    driveTime: 'Drive Time',
    totalBreak: 'Breaks',
    netTime: 'Net Time',
    workDays: 'Work Days',
    sickDays: 'Sick Days',
    vacationDays: 'Vacation',
    holidays: 'Holidays',
    hourlyRate: 'Hourly Rate',
    printReport: 'Print Monthly Report',
    printWeeklyReport: 'Print Weekly Report',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    workerInfo: 'Worker Info',
    company: 'Company',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    weeklyHours: 'Weekly Hours',
    monthlyReport: 'Monthly Report',
    noData: 'No tracked data found.',
    copied: 'Code copied!',
    day: 'Day',
    area: 'Area',
    start: 'Start',
    end: 'End',
    breakMin: 'Break (min)',
    driveMin: 'Drive (min)',
    net: 'Net',
    salary: 'Calculated Salary',
    weeklyReport: 'Weekly Report'
  },
  de: {
    dashboard: 'Arbeitgeber-Dashboard',
    inviteCode: 'Ihr Mitarbeiter-Freigabecode:',
    shareHelp: 'Teilen Sie diesen Code mit Ihren Mitarbeitern, um sie zu verknüpfen:',
    noWorkers: 'Noch keine Mitarbeiter mit Ihrem Konto verknüpft.',
    workers: 'Mitarbeiterliste',
    selectWorker: 'Bitte wählen Sie einen Mitarbeiter aus, um dessen Daten anzuzeigen.',
    selectPeriod: 'Zeitraum',
    totalHours: 'Gesamtstunden',
    driveTime: 'Fahrzeit',
    totalBreak: 'Pause Gesamt',
    netTime: 'Nettozeit',
    workDays: 'Arbeitstage',
    sickDays: 'Krankheitstage',
    vacationDays: 'Urlaub',
    holidays: 'Feiertage',
    hourlyRate: 'Stundensatz',
    printReport: 'Monatsbericht drucken',
    printWeeklyReport: 'Wochenbericht drucken',
    week: 'Woche',
    month: 'Monat',
    year: 'Jahr',
    workerInfo: 'Mitarbeiterinfo',
    company: 'Firma',
    name: 'Name',
    phone: 'Telefon',
    email: 'E-Mail',
    weeklyHours: 'Wöchentliche Arbeitsstunden',
    monthlyReport: 'Monatsbericht',
    noData: 'Keine erfassten Daten gefunden.',
    copied: 'Code kopiert!',
    day: 'Tag',
    area: 'Bereich',
    start: 'Beginn',
    end: 'Ende',
    breakMin: 'Pause (Min)',
    driveMin: 'Fahrt (Min)',
    net: 'Netto',
    salary: 'Berechnetes Gehalt',
    weeklyReport: 'Wochenbericht'
  }
}

// Helpers for date calculations
const DAYS_OF_WEEK = {
  de: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  ar: ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد']
}

const MONTHS_OF_YEAR = {
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
}

function getStartOfWeek(offset = 0) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now.setDate(now.getDate() + diff))
  monday.setDate(monday.getDate() + offset * 7)
  return monday
}

function getWeekDays(offset = 0) {
  const start = getStartOfWeek(offset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function toISODate(d) {
  return d.toISOString().slice(0, 10)
}

function formatTime(minutes) {
  if (!minutes) return '0:00'
  const h = Math.floor(Math.abs(minutes) / 60)
  const m = Math.round(Math.abs(minutes) % 60)
  return `${h}:${m < 10 ? '0' : ''}${m}`
}

function parseTimeToMin(timeStr) {
  if (!timeStr) return 0
  const parts = timeStr.split(':')
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
}

export default function EmployerDashboard({ currentUser, onLogout, lang = 'de' }) {
  const trans = vocab[lang] || vocab.de
  const [workers, setWorkers] = useState([])
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [years, setYears] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [workerData, setWorkerData] = useState({ data: {}, settings: {} })
  const [loading, setLoading] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [activeTab, setActiveTab] = useState('week') // week | month | salary

  // Fetch linked workers on mount
  useEffect(() => {
    async function load() {
      try {
        const list = await getEmployerWorkers()
        setWorkers(list || [])
      } catch (err) {
        toast.error('Failed to load workers')
      }
    }
    load()
  }, [])

  // Fetch worker years when selected
  useEffect(() => {
    if (!selectedWorker) return
    async function load() {
      try {
        const list = await getWorkerYears(selectedWorker.id)
        setYears(list || [])
        if (list?.length) {
          setSelectedYear(list[0])
        }
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [selectedWorker])

  // Fetch worker year data
  useEffect(() => {
    if (!selectedWorker || !selectedYear) return
    async function load() {
      setLoading(true)
      try {
        const res = await getWorkerYearData(selectedWorker.id, selectedYear)
        setWorkerData(res || { data: {}, settings: {} })
      } catch (err) {
        toast.error('Failed to load worker hours')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedWorker, selectedYear])

  const wSettings = workerData.settings?.settings || {}
  const hourlyRate = parseFloat(wSettings.rate) || 0

  // Week statistics
  const currentWeekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset])
  
  const weekStats = useMemo(() => {
    let arb = 0, fahr = 0, pause = 0
    let workDays = 0, sickDays = 0, holidays = 0, vacation = 0

    currentWeekDays.forEach(day => {
      const iso = toISODate(day)
      const dayRecord = workerData.data?.[iso]
      if (!dayRecord) return

      const type = dayRecord.type || 'work'
      if (type === 'sick') sickDays++
      else if (type === 'holiday') holidays++
      else if (type === 'vacation') vacation++
      else if (dayRecord.entries?.length) workDays++

      if (dayRecord.entries) {
        dayRecord.entries.forEach(e => {
          const duration = parseTimeToMin(e.end) - parseTimeToMin(e.start)
          if (duration > 0) {
            arb += duration
            fahr += (parseFloat(e.fahrt) || 0) * 60
            pause += (parseFloat(e.pause) || 0) * 60
          }
        })
      }
    })

    return { arb, fahr, pause, net: arb + fahr - pause, workDays, sickDays, holidays, vacation }
  }, [currentWeekDays, workerData])

  // Month statistics
  const monthStats = useMemo(() => {
    let arb = 0, fahr = 0, pause = 0
    let workDays = 0, sickDays = 0, holidays = 0, vacation = 0

    Object.entries(workerData.data || {}).forEach(([iso, dayRecord]) => {
      const date = new Date(iso)
      if (date.getFullYear() !== selectedYear || date.getMonth() !== selectedMonth) return

      const type = dayRecord.type || 'work'
      if (type === 'sick') sickDays++
      else if (type === 'holiday') holidays++
      else if (type === 'vacation') vacation++
      else if (dayRecord.entries?.length) workDays++

      if (dayRecord.entries) {
        dayRecord.entries.forEach(e => {
          const duration = parseTimeToMin(e.end) - parseTimeToMin(e.start)
          if (duration > 0) {
            arb += duration
            fahr += (parseFloat(e.fahrt) || 0) * 60
            pause += (parseFloat(e.pause) || 0) * 60
          }
        })
      }
    })

    return { arb, fahr, pause, net: arb + fahr - pause, workDays, sickDays, holidays, vacation }
  }, [workerData, selectedYear, selectedMonth])

  // Local date helpers inside component
  const getCurrentMondayLocal = () => {
    const t = new Date(); t.setHours(0,0,0,0)
    const d = t.getDay(), diff = d===0?6:d-1
    t.setDate(t.getDate()-diff); return t
  }
  const BASE_LOCAL = getCurrentMondayLocal()

  const getMondayByOffsetLocal = (offset) => {
    const d = new Date(BASE_LOCAL); d.setDate(BASE_LOCAL.getDate()+offset*7); return d
  }
  const getWeekDatesLocal = (offset) => {
    const mon = getMondayByOffsetLocal(offset)
    return Array.from({length:7},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return d})
  }
  const getKWLocal = (date) => {
    const u = new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()))
    u.setUTCDate(u.getUTCDate()+4-(u.getUTCDay()||7))
    return Math.ceil((((u-new Date(Date.UTC(u.getUTCFullYear(),0,1)))/864e5)+1)/7)
  }

  const styleR1 = 'background-color: #F5A623; color: #412402; font-weight: bold; border: 1px solid #bbb; padding: 4px 6px; text-align: center;'
  const styleR2 = 'background-color: #FAD07A; color: #633806; font-weight: bold; border: 1px solid #bbb; padding: 4px 6px; text-align: center;'
  const styleRg = 'background-color: #C8E6A0; color: #27500A; border: 1px solid #bbb; padding: 4px 6px; text-align: center;'
  const styleRbl = 'background-color: #B5D4F4; color: #0C447C; border: 1px solid #bbb; padding: 4px 6px; text-align: center;'
  const styleRo = 'background-color: #F5C4B3; color: #712B13; border: 1px solid #bbb; padding: 4px 6px; text-align: center;'
  const styleRtot = 'background-color: #4CAF50; color: #ffffff; font-weight: bold; border: 1px solid #bbb; padding: 4px 6px; text-align: center;'
  const styleRsk = 'background-color: #FCEBEB; color: #A32D2D; font-weight: bold; border: 1px solid #bbb; padding: 4px 6px; text-align: center;'
  const styleRho = 'background-color: #E6F1FB; color: #185FA5; font-weight: bold; border: 1px solid #bbb; padding: 4px 6px; text-align: center;'
  const styleRva = 'background-color: #EAF3DE; color: #3B6D11; font-weight: bold; border: 1px solid #bbb; padding: 4px 6px; text-align: center;'
  const styleTd = 'border: 1px solid #bbb; padding: 4px 6px; text-align: center; font-size: 10px; color: #222;'

  const getDaySum = (k) => {
    const d = workerData.data?.[k]
    if (!d) return { arb: 0, fahr: 0, pause: 0, tot: 0, wt: 0, sk: 0, hl: 0, vc: 0 }
    let a = 0, f = 0, p = 0
    
    const pT = s => {
      if (!s||!s.trim()) return 0
      const m=s.trim().match(/^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})$/)
      if(!m)return 0
      let d=(+m[3]*60+ +m[4])-(+m[1]*60+ +m[2]); return(d<0?d+1440:d)/60
    }
    const cA  = e => (e.days||[]).reduce((s,d)=>s+pT(d),0)

    ;(d.entries || []).forEach(e => {
      const mins = (() => {
        if (e.start && e.end) {
          const t = parseTimeToMin(e.end) - parseTimeToMin(e.start)
          return t > 0 ? t : 0
        }
        return (e.days || []).reduce((s, dd) => s + pT(dd), 0) * 60
      })()
      if (e.days) {
        a += cA(e) * 60
      } else {
        a += mins
      }
      f += (parseFloat(e.fahrt) || 0) * 60
      p += (parseFloat(e.pause) || 0) * 60
    })
    
    const typ = d.type || 'work'
    return {
      arb: a,
      fahr: f,
      pause: p,
      tot: a + f - p,
      wt: a > 0 && typ === 'work' ? 1 : 0,
      sk: typ === 'sick' ? 1 : 0,
      hl: typ === 'holiday' ? 1 : 0,
      vc: typ === 'vacation' ? 1 : 0,
    }
  }

  const fH = (m) => {
    if (!m || m === 0) return '0h'
    const hh = m / 60
    return hh === Math.floor(hh) ? Math.floor(hh) + 'h' : hh.toFixed(2) + 'h'
  }

  const wkTblHtml = (off, showHdr) => {
    const dts  = getWeekDatesLocal(off)
    const kw   = getKWLocal(dts[0])
    const dn   = lang==='ar'?3:2

    let tA=0, tf=0, tp2=0
    let dA=Array(7).fill(0), dF=Array(7).fill(0), dP=Array(7).fill(0)
    let rows = ''
    
    const formatDDMMLocal = d => `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.`
    const formatFullLocal = d => formatDDMMLocal(d) + d.getFullYear()
    
    const RCLS_INLINE = {
      sick: styleRsk,
      holiday: styleRho,
      vacation: styleRva
    }

    // 1. Determine max entries on any day
    let maxEntries = 0
    dts.forEach((d) => {
      const k = toISODate(d)
      const dayData = workerData.data?.[k] || {}
      if (dayData.type === 'work' || !dayData.type) {
        const count = (dayData.entries || []).length
        if (count > maxEntries) maxEntries = count
      }
    })
    if (maxEntries === 0) maxEntries = 1

    // 2. Build rows
    for (let r = 0; r < maxEntries; r++) {
      let rowWorkMins = 0
      let cells = []

      dts.forEach((d, i) => {
        const k = toISODate(d)
        const dayData = workerData.data?.[k] || {}
        const typ = dayData.type || 'work'

        if (typ !== 'work') {
          if (r === 0) {
            const letter = typ === 'sick' ? (lang === 'ar' ? 'م' : lang === 'en' ? 'S' : 'K') :
                           typ === 'holiday' ? (lang === 'ar' ? 'ع' : lang === 'en' ? 'H' : 'F') :
                           typ === 'vacation' ? (lang === 'ar' ? 'إ' : lang === 'en' ? 'V' : 'U') : ''
            cells.push(`<td style="${RCLS_INLINE[typ] || styleTd}; font-weight:bold; font-size:12px; padding:8px 4px;">${letter}</td>`)
          } else {
            cells.push(`<td style="${styleTd}"></td>`)
          }
        } else {
          const entriesList = dayData.entries || []
          if (r < entriesList.length) {
            const e = entriesList[r]
            const area = e.obj || e.area || ''
            const activity = e.taet || e.activity || ''
            
            const pT = s => {
              if (!s||!s.trim()) return 0
              const m=s.trim().match(/^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})$/)
              if(!m)return 0
              let d=(+m[3]*60+ +m[4])-(+m[1]*60+ +m[2]); return(d<0?d+1440:d)/60
            }
            const cA  = e => (e.days||[]).reduce((s,d)=>s+pT(d),0)

            if (e.days) {
              const rc = (e.tg || [])[i] ? RCLS_INLINE[(e.tg || [])[i]] : styleTd
              cells.push(`<td style="${rc}; font-size:10px; font-family:monospace">${e.days[i] || ''}</td>`)
              if (i === 0) {
                tA += cA(e) * 60
                rowWorkMins += cA(e) * 60
              }
            } else {
              const range = e.start && e.end ? `${e.start}–${e.end}` : ''
              const mins = (() => {
                if (e.start && e.end) {
                  const t = parseTimeToMin(e.end) - parseTimeToMin(e.start)
                  return t > 0 ? t : 0
                }
                return 0
              })()

              const fahrt = (parseFloat(e.fahrt) || 0) * 60
              const pause = (parseFloat(e.pause) || 0) * 60

              tA += mins
              dA[i] += mins

              tf += fahrt
              dF[i] += fahrt

              tp2 += pause
              dP[i] += pause

              rowWorkMins += mins

              const parts = []
              if (area) parts.push(`<span style="font-weight:bold;display:block;margin-bottom:1px;font-size:9.5px;">${area}</span>`)
              if (activity) parts.push(`<span style="color:#555;display:block;margin-bottom:1px;font-size:9px;">${activity}</span>`)
              if (range) parts.push(`<span style="font-family:monospace;font-weight:600;font-size:9.5px;color:#111;">${range}</span>`)
              
              cells.push(`<td style="${styleTd}">${parts.join('')}</td>`)
            }
          } else {
            cells.push(`<td style="${styleTd}"></td>`)
          }
        }
      })

      const entryLabel = lang === 'ar' ? 'إدخال' : lang === 'en' ? 'Entry' : 'Eintrag'
      rows += `<tr>
        <td colspan="2" style="${styleTd}; text-align:center; font-weight:bold; background-color:#fafafa; color:#555; font-size:10px;">${entryLabel} ${r + 1}</td>
        ${cells.join('')}
        <td style="${styleRg}; font-weight:500">${rowWorkMins > 0 ? fH(rowWorkMins) : ''}</td>
      </tr>`
    }

    const noELbl = lang === 'ar' ? 'لا إدخالات' : lang === 'en' ? 'No entries' : 'Keine Einträge'
    if(!rows) rows=`<tr><td colspan="10" style="${styleTd}; text-align:center; color:#888; padding:5px">${noELbl}</td></tr>`

    const hdrs = (DAYS_OF_WEEK[lang] || DAYS_OF_WEEK.de).map((dd,i)=>
      `<th style="${styleR2}">${dd.slice(0,dn)}<br><span style="font-weight:400;font-size:9px">${formatDDMMLocal(dts[i])}</span></th>`
    ).join('')

    const em = selectedWorker.name || ''
    const co = wSettings.co || ''
    const email = selectedWorker.email || ''
    const phone = wSettings.phone || ''

    const mitLbl = lang === 'ar' ? 'الموظف' : lang === 'en' ? 'Employee' : 'Mitarbeiter'
    const gesLbl = lang === 'ar' ? 'الإجمالي' : lang === 'en' ? 'Total' : 'Gesamt'
    const arbLbl = lang === 'ar' ? 'ساعات العمل' : lang === 'en' ? 'Work Time' : 'Arbeitszeit'
    const fahrLbl = lang === 'ar' ? 'القيادة' : lang === 'en' ? 'Drive Time' : 'Fahrzeit'
    const pauLbl = lang === 'ar' ? 'الاستراحة' : lang === 'en' ? 'Break' : 'Pause'

    const hdr = showHdr
      ? `<tr><th colspan="10" style="${styleR1}; text-align:left; padding:5px 7px; font-size:12px">${co}${phone ? ` &nbsp;|&nbsp; ${phone}` : ''}</th></tr>
         <tr><th colspan="5" style="${styleR1}; text-align:left; padding:3px 7px">${mitLbl}: ${em}</th><th colspan="5" style="${styleR1}; text-align:right; padding:3px 7px; font-size:10px">${email}</th></tr>`
      : ''

    return `
    <thead>
      ${hdr}
      <tr><th colspan="10" style="${styleR2}; text-align:left; padding:3px 7px">KW ${kw} | ${formatDDMMLocal(dts[0])} – ${formatFullLocal(dts[6])}</th></tr>
      <tr>
        <th colspan="2" style="${styleR2}; text-align:center">${lang==='ar'?'الإدخالات':lang==='en'?'Entries':'Einträge'}</th>
        ${hdrs}
        <th style="${styleR2}">${gesLbl}</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr>
        <td colspan="2" style="${styleRg}; text-align:right; font-weight:500">${arbLbl}</td>
        ${dA.map(v => `<td style="${styleRg}">${v>0?fH(v):''}</td>`).join('')}
        <td style="${styleRg}">${fH(tA)}</td>
      </tr>
      <tr>
        <td colspan="2" style="${styleRbl}; text-align:right; font-weight:500">${fahrLbl}</td>
        ${dF.map(v => `<td style="${styleRbl}">${v>0?fH(v):''}</td>`).join('')}
        <td style="${styleRbl}">${fH(tf)}</td>
      </tr>
      <tr>
        <td colspan="2" style="${styleRo}; text-align:right; font-weight:500">${pauLbl}</td>
        ${dP.map(v => `<td style="${styleRo}">${v>0?fH(v):''}</td>`).join('')}
        <td style="${styleRo}">${fH(tp2)}</td>
      </tr>
      <tr>
        <td colspan="9" style="${styleTd}; text-align:right; font-weight:500; background-color:#f5f5f5">${gesLbl} KW ${kw}</td>
        <td style="${styleRtot}">${fH(tA+tf-tp2)}</td>
      </tr>
    </tbody>`
  }

  const daySummaryHtml = (keys) => {
    let wt=0, sk=0, hl=0, vc=0
    keys.forEach(k => {
      const s = getDaySum(k)
      wt += s.wt; sk += s.sk; hl += s.hl; vc += s.vc
    })

    const lwLbl = lang === 'ar' ? 'أيام العمل' : lang === 'en' ? 'Work Days' : 'Arbeitstage'
    const lsLbl = lang === 'ar' ? 'أيام المرض' : lang === 'en' ? 'Sick Days' : 'Krankheitstage'
    const lhLbl = lang === 'ar' ? 'أيام العطل' : lang === 'en' ? 'Holidays' : 'Feiertage'
    const lvLbl = lang === 'ar' ? 'الإجازة' : lang === 'en' ? 'Vacation' : 'Urlaub'

    const styleLwVal = 'font-weight:700; font-size:15px; padding:7px; background-color:#FAD07A; color:#633806; border:1px solid #bbb; text-align:center;'
    const styleLsVal = 'font-weight:700; font-size:15px; padding:7px; background-color:#FCEBEB; color:#A32D2D; border:1px solid #bbb; text-align:center;'
    const styleLhVal = 'font-weight:700; font-size:15px; padding:7px; background-color:#E6F1FB; color:#185FA5; border:1px solid #bbb; text-align:center;'
    const styleLvVal = 'font-weight:700; font-size:15px; padding:7px; background-color:#EAF3DE; color:#3B6D11; border:1px solid #bbb; text-align:center;'

    return `
    <table style="margin-top:10px; max-width:400px; border-collapse:collapse; width:100%;">
      <thead>
        <tr>
          <th style="${styleR2}; width:25%">${lwLbl}</th>
          <th style="background-color:#FCEBEB; color:#A32D2D; font-weight:600; width:25%; border:1px solid #bbb; padding:4px 6px; text-align:center;">${lsLbl}</th>
          <th style="background-color:#E6F1FB; color:#185FA5; font-weight:600; width:25%; border:1px solid #bbb; padding:4px 6px; text-align:center;">${lhLbl}</th>
          <th style="background-color:#EAF3DE; color:#3B6D11; font-weight:600; width:25%; border:1px solid #bbb; padding:4px 6px; text-align:center;">${lvLbl}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="${styleLwVal}">${wt}</td>
          <td style="${styleLsVal}">${sk}</td>
          <td style="${styleLhVal}">${hl}</td>
          <td style="${styleLvVal}">${vc}</td>
        </tr>
      </tbody>
    </table>`
  }

  const buildWeeklyHtml = (off) => {
    const dts = getWeekDatesLocal(off)
    const kw = getKWLocal(dts[0])
    const formatDDMMLocal = d => `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.`
    const formatFullLocal = d => formatDDMMLocal(d) + d.getFullYear()
    const period = `KW ${kw}  |  ${formatDDMMLocal(dts[0])}–${formatFullLocal(dts[6])}`
    const allKeys = dts.map(d => toISODate(d))
    const html = `<div style="overflow-x:auto"><table style="border-collapse:collapse; width:100%;">${wkTblHtml(off, true)}</table></div>${daySummaryHtml(allKeys)}`
    return { period, html }
  }

  const buildMonthlyCombinedHtml = () => {
    const base = new Date(selectedYear, selectedMonth, 1)
    const period = `${MONTHS_OF_YEAR[lang]?.[selectedMonth]} ${selectedYear}`
    const weeks = []
    
    // Find all weeks that belong to this month
    for (let i = -60; i < 60; i++) {
      const mm = getMondayByOffsetLocal(i)
      if (mm.getFullYear() === selectedYear && mm.getMonth() === selectedMonth && !weeks.includes(i)) {
        weeks.push(i)
      }
    }
    weeks.sort((a, b) => a - b)
    
    let mA = 0, mF = 0, mP = 0
    const allKeys = []
    weeks.forEach(w => {
      getWeekDatesLocal(w).forEach(d => {
        const k = toISODate(d)
        allKeys.push(k)
        const s = getDaySum(k)
        mA += s.arb; mF += s.fahr; mP += s.pause
      })
    })

    let html = ''
    const noELbl = lang === 'ar' ? 'لا إدخالات' : lang === 'en' ? 'No entries' : 'Keine Einträge'
    if (!weeks.length) {
      html = `<div style="text-align:center; padding:16px; color:#888">${noELbl}</div>`
    } else {
      for (let pi = 0; pi < weeks.length; pi += 2) {
        const pair = weeks.slice(pi, pi + 2)
        const isLast = pi + 2 >= weeks.length
        html += `<div${isLast ? '' : ' style="page-break-after:always;"'}>`
        pair.forEach((wo, idx) => {
          html += `<table style="border-collapse:collapse; width:100%; margin-bottom:${idx === 0 && pair.length > 1 ? '14px' : '0'}">${wkTblHtml(wo, pi === 0 && idx === 0)}</table>`
        })
        html += `</div>`
      }
    }

    const mo2Lbl = lang === 'ar' ? 'ملخص الشهر' : lang === 'en' ? 'Month Overview' : 'Monatsübersicht'
    const gmoLbl = lang === 'ar' ? 'الإجمالي الشهري' : lang === 'en' ? 'MONTH TOTAL' : 'GESAMT MONAT'
    const arbLbl = lang === 'ar' ? 'ساعات العمل' : lang === 'en' ? 'Work Time' : 'Arbeitszeit'
    const fahrLbl = lang === 'ar' ? 'القيادة' : lang === 'en' ? 'Drive Time' : 'Fahrzeit'
    const pauLbl = lang === 'ar' ? 'الاستراحة' : lang === 'en' ? 'Break' : 'Pause'

    html += `
    <table style="border-collapse:collapse; width:100%; margin-top:12px">
      <thead>
        <tr>
          <th colspan="10" style="${styleR1}; text-align:left; padding:5px 7px">
            ${mo2Lbl}: ${MONTHS_OF_YEAR[lang]?.[selectedMonth]} ${selectedYear}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colspan="9" style="${styleRg}; text-align:right; font-weight:500">${arbLbl}</td>
          <td style="${styleRg}">${fH(mA)}</td>
        </tr>
        <tr>
          <td colspan="9" style="${styleRbl}; text-align:right; font-weight:500">${fahrLbl}</td>
          <td style="${styleRbl}">${fH(mF)}</td>
        </tr>
        <tr>
          <td colspan="9" style="${styleRo}; text-align:right; font-weight:500">${pauLbl}</td>
          <td style="${styleRo}">${fH(mP)}</td>
        </tr>
        <tr>
          <td colspan="9" style="${styleTd}; text-align:right; font-weight:500; background-color:#f5f5f5">${gmoLbl}</td>
          <td style="${styleRtot}; font-size:13px">${fH(mA + mF - mP)}</td>
        </tr>
      </tbody>
    </table>
    ${daySummaryHtml(allKeys)}`

    return { period, html }
  }

  // Print helper
  const handlePrint = () => {
    if (currentUser.plan?.toLowerCase() !== 'pro') {
      toast.error(lang === 'ar' 
        ? 'طباعة التقارير تتطلب اشتراك صاحب عمل فعال.' 
        : lang === 'en' 
          ? 'Printing reports requires an active Employer subscription.' 
          : 'Das Drucken von Berichten erfordert ein aktives Arbeitgeber-Abonnement.'
      )
      return
    }
    if (activeTab === 'week') {
      handlePrintWeekly()
    } else {
      handlePrintMonthly()
    }
  }

  const handlePrintWeekly = () => {
    const { period, html } = buildWeeklyHtml(weekOffset)
    let sigHtml = ''
    if (wSettings.signature) {
      const sigLbl = lang === 'ar' ? 'توقيع العامل' : lang === 'en' ? "Worker's Signature" : 'Unterschrift Mitarbeiter'
      sigHtml = `<div style="margin-top:30px; page-break-inside:avoid; display:flex; justify-content:flex-end;">
        <div style="text-align:center;">
          <img src="${wSettings.signature}" style="max-height:80px; border-bottom:1px solid #222; padding-bottom:5px;" />
          <div style="font-size:12px; margin-top:4px;">${sigLbl}</div>
        </div>
      </div>`
    }
    const co = wSettings.co || ''
    const w = window.open('', '_blank', 'width=1050,height=750')
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${co} – ${period}</title><style>
      body { font-family: Arial, sans-serif; padding: 10px; background: #fff; color: #222; }
      @media print { @page { size: A4 landscape; margin: 8mm; } }
    </style></head><body>${html}${sigHtml}</body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 700)
  }

  const handlePrintMonthly = () => {
    const { period, html } = buildMonthlyCombinedHtml()
    let sigHtml = ''
    if (wSettings.signature) {
      const sigLbl = lang === 'ar' ? 'توقيع العامل' : lang === 'en' ? "Worker's Signature" : 'Unterschrift Mitarbeiter'
      sigHtml = `<div style="margin-top:30px; page-break-inside:avoid; display:flex; justify-content:flex-end;">
        <div style="text-align:center;">
          <img src="${wSettings.signature}" style="max-height:80px; border-bottom:1px solid #222; padding-bottom:5px;" />
          <div style="font-size:12px; margin-top:4px;">${sigLbl}</div>
        </div>
      </div>`
    }
    const co = wSettings.co || ''
    const w = window.open('', '_blank', 'width=1050,height=750')
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${co} – ${period}</title><style>
      body { font-family: Arial, sans-serif; padding: 10px; background: #fff; color: #222; }
      @media print { @page { size: A4 landscape; margin: 8mm; } }
    </style></head><body>${html}${sigHtml}</body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 700)
  }

  const exportHtmlTableToExcel = (tableHtml, filename) => {
    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Sheet1</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8">
      </head>
      <body>
        ${tableHtml}
      </body>
      </html>
    `;
    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleExportWeeklyExcel = () => {
    if (currentUser.plan?.toLowerCase() !== 'pro') {
      toast.error(lang === 'ar' 
        ? 'تصدير التقارير إلى Excel يتطلب اشتراك صاحب عمل فعال.' 
        : lang === 'en' 
          ? 'Exporting reports to Excel requires an active Employer subscription.' 
          : 'Das Exportieren von Berichten nach Excel erfordert ein aktives Arbeitgeber-Abonnement.'
      )
      return
    }
    const { period, html } = buildWeeklyHtml(weekOffset)
    const em = selectedWorker.name || 'Worker'
    const filename = `${em}_woche_${getStartOfWeek(weekOffset).toLocaleDateString()}.xls`
    exportHtmlTableToExcel(html, filename)
  }

  const handleExportMonthlyExcel = () => {
    if (currentUser.plan?.toLowerCase() !== 'pro') {
      toast.error(lang === 'ar' 
        ? 'تصدير التقارير إلى Excel يتطلب اشتراك صاحب عمل فعال.' 
        : lang === 'en' 
          ? 'Exporting reports to Excel requires an active Employer subscription.' 
          : 'Das Exportieren von Berichten nach Excel erfordert ein aktives Arbeitgeber-Abonnement.'
      )
      return
    }
    const { period, html } = buildMonthlyCombinedHtml()
    const em = selectedWorker.name || 'Worker'
    const filename = `${em}_monat_${MONTHS_OF_YEAR[lang]?.[selectedMonth]}_${selectedYear}.xls`
    exportHtmlTableToExcel(html, filename)
  }

  const formatEuro = (val) => {
    return val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
  }

  const isRTL = lang === 'ar'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100/60 p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Printable Area Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-full {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          .print-header {
            display: block !important;
            margin-bottom: 20px;
          }
        }
      `}</style>

      {/* Top Banner (No Print) */}
      <header className="no-print flex flex-col sm:flex-row items-center justify-between bg-white/70 backdrop-blur border border-purple-200/80 rounded-2xl p-4 mb-6 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white text-xl">
            💼
          </div>
          <div>
            <h1 className="text-base font-extrabold text-purple-900">{trans.dashboard}</h1>
            <p className="text-xs text-purple-600/80">{currentUser.name || currentUser.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full text-xs font-bold">
            <span>{trans.inviteCode}</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded text-sm text-purple-950 select-all border border-purple-200">{currentUser.employerCode}</span>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(currentUser.employerCode);
              toast.success(trans.copied);
            }}
            className="text-xs font-bold text-purple-600 hover:text-purple-800 cursor-pointer"
          >
            {lang === 'ar' ? 'نسخ' : 'Copy'}
          </button>

          <div className="w-px h-6 bg-purple-200" />

          <Button variant="danger" onClick={onLogout} className="!py-1.5 !px-3 text-xs">
            <LogOut size={14} />
          </Button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Workers Sidebar (No Print) */}
        <aside className="no-print lg:col-span-1 bg-white/75 backdrop-blur border border-purple-200 rounded-2xl p-4 shadow-sm">
          <SectionHeader>
            <div className="flex items-center gap-1.5">
              <Users size={14} />
              <span>{trans.workers}</span>
            </div>
          </SectionHeader>

          {workers.length === 0 ? (
            <p className="text-xs text-purple-400 italic py-4 text-center">{trans.noWorkers}</p>
          ) : (
            <div className="space-y-1.5 mt-3">
              {workers.map(w => {
                const isSelected = selectedWorker?.id === w.id
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      setSelectedWorker(w);
                      setWeekOffset(0);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-0.5
                      ${isSelected
                        ? 'bg-purple-600 text-white border-transparent shadow-md shadow-purple-600/20'
                        : 'bg-white/50 border-purple-100 text-purple-900 hover:border-purple-300'
                      }`}
                    style={isRTL ? { textAlign: 'right' } : {}}
                  >
                    <span className="text-sm font-bold truncate">{w.name || 'Unnamed Worker'}</span>
                    <span className={`text-[10px] truncate ${isSelected ? 'text-purple-200' : 'text-purple-500'}`}>{w.email}</span>
                  </button>
                )
              })}
            </div>
          )}
        </aside>

        {/* Worker Details & Hours Grid */}
        <main className="lg:col-span-3 print-full space-y-6">
          {!selectedWorker ? (
            <div className="no-print bg-white/70 backdrop-blur border border-purple-200 rounded-2xl p-12 text-center shadow-sm">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-purple-600 font-bold">{trans.selectWorker}</p>
            </div>
          ) : (
            <>
              {/* Header Details (Visually Hidden on Web, Shown on Print) */}
              <div className="hidden print-header border-b-2 border-purple-900 pb-4">
                <h2 className="text-xl font-extrabold text-purple-900">Arbeitszeit Pro — Stundenbericht</h2>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <p><strong>Mitarbeiter:</strong> {selectedWorker.name || 'Unnamed'}</p>
                    <p><strong>E-Mail:</strong> {selectedWorker.email}</p>
                    <p><strong>Firma:</strong> {wSettings.co || '-'}</p>
                  </div>
                  <div>
                    <p><strong>Stundensatz:</strong> {hourlyRate > 0 ? formatEuro(hourlyRate) : '-'}</p>
                    <p><strong>Zeitraum:</strong> {activeTab === 'week' ? `Woche ${getStartOfWeek(weekOffset).toLocaleDateString()} - ${new Date(new Date(getStartOfWeek(weekOffset)).setDate(getStartOfWeek(weekOffset).getDate() + 6)).toLocaleDateString()}` : `${MONTHS_OF_YEAR[lang][selectedMonth]} ${selectedYear}`}</p>
                  </div>
                </div>
              </div>

              {/* Worker Profile Card (No Print) */}
              <section className="no-print bg-white/80 border border-purple-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <h2 className="text-base font-extrabold text-purple-900">{selectedWorker.name || 'Unnamed'}</h2>
                  <p className="text-xs text-purple-500">{selectedWorker.email}</p>
                  <div className="flex gap-2 flex-wrap mt-3">
                    {wSettings.co && <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-100">{trans.company}: {wSettings.co}</span>}
                    {hourlyRate > 0 && <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded border border-green-100">{trans.hourlyRate}: {formatEuro(hourlyRate)}/h</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {years.length > 1 && (
                    <select
                      value={selectedYear}
                      onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
                      className="bg-white border border-purple-200 rounded-xl px-3 py-1.5 text-xs font-bold text-purple-900 outline-none focus:border-purple-500"
                    >
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  )}
                  <Button variant="ghost" onClick={handlePrint} className={`!py-1.5 !px-3 text-xs gap-1 ${currentUser.plan?.toLowerCase() !== 'pro' ? 'opacity-85' : ''}`}>
                    {currentUser.plan?.toLowerCase() !== 'pro' ? '🔒' : <Printer size={13} />}
                    <span>{activeTab === 'week' ? trans.printWeeklyReport : trans.printReport}</span>
                  </Button>
                  {activeTab === 'week' && (
                    <Button variant="ghost" onClick={handleExportWeeklyExcel} className={`!py-1.5 !px-3 text-xs gap-1 border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 ${currentUser.plan?.toLowerCase() !== 'pro' ? 'opacity-85' : ''}`}>
                      {currentUser.plan?.toLowerCase() !== 'pro' ? '🔒' : '📊'} Excel ({trans.week})
                    </Button>
                  )}
                  {activeTab === 'month' && (
                    <Button variant="ghost" onClick={handleExportMonthlyExcel} className={`!py-1.5 !px-3 text-xs gap-1 border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 ${currentUser.plan?.toLowerCase() !== 'pro' ? 'opacity-85' : ''}`}>
                      {currentUser.plan?.toLowerCase() !== 'pro' ? '🔒' : '📊'} Excel ({trans.month})
                    </Button>
                  )}
                </div>
              </section>

              {/* Tab Selector (No Print) */}
              <div className="no-print flex border-b border-purple-200 bg-white/40 p-1 rounded-xl gap-1">
                {['week', 'month', 'salary'].map(tab => {
                  const active = activeTab === tab
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer
                        ${active ? 'bg-purple-600 text-white shadow' : 'text-purple-600 hover:bg-white/60'}`}
                    >
                      {tab === 'week' ? trans.week : tab === 'month' ? trans.month : trans.salary}
                    </button>
                  )
                })}
              </div>

              {/* Tab Content: Week */}
              {activeTab === 'week' && (
                <div className="space-y-4">
                  {/* Week Navigator (No Print) */}
                  <div className="no-print flex items-center justify-between bg-white rounded-xl border border-purple-100 p-3 shadow-sm">
                    <Button variant="icon" onClick={() => setWeekOffset(prev => prev - 1)}>
                      {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </Button>
                    <span className="text-xs font-bold text-purple-900">
                      {getStartOfWeek(weekOffset).toLocaleDateString()} — {new Date(new Date(getStartOfWeek(weekOffset)).setDate(getStartOfWeek(weekOffset).getDate() + 6)).toLocaleDateString()}
                    </span>
                    <Button variant="icon" onClick={() => setWeekOffset(prev => prev + 1)}>
                      {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </Button>
                  </div>

                  {/* Statistics Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { l: trans.totalHours, v: formatTime(weekStats.arb + weekStats.fahr), sub: `${formatTime(weekStats.arb)} + ${formatTime(weekStats.fahr)}`, icon: '⏱' },
                      { l: trans.totalBreak, v: formatTime(weekStats.pause), sub: 'Pause', icon: '☕' },
                      { l: trans.netTime, v: formatTime(weekStats.net), sub: 'Netto', icon: '🏁' },
                      { l: trans.workDays, v: weekStats.workDays, sub: `${weekStats.sickDays} K / ${weekStats.vacation} U`, icon: '🗓' }
                    ].map((s, i) => (
                      <div key={i} className="bg-purple-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">{s.l}</p>
                          <h3 className="text-lg font-black mt-1">{s.v}</h3>
                          <p className="text-[9px] opacity-75 mt-0.5">{s.sub}</p>
                        </div>
                        <span className="text-2xl">{s.icon}</span>
                      </div>
                    ))}
                  </div>

                  {/* Week Entries Table */}
                  <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border-collapse" style={isRTL ? { textAlign: 'right' } : {}}>
                        <thead>
                          <tr className="bg-purple-50/70 text-purple-800 text-xs font-bold border-b border-purple-100">
                            <th className="p-3">{trans.day}</th>
                            <th className="p-3">{trans.area}</th>
                            <th className="p-3">{trans.start}</th>
                            <th className="p-3">{trans.end}</th>
                            <th className="p-3">{trans.breakMin}</th>
                            <th className="p-3">{trans.driveMin}</th>
                            <th className="p-3">{trans.net}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentWeekDays.map((day, idx) => {
                            const iso = toISODate(day)
                            const dayRecord = workerData.data?.[iso]
                            const dayName = DAYS_OF_WEEK[lang]?.[idx] || ''
                            const dayLabel = `${dayName} (${day.getDate()}.${day.getMonth() + 1}.)`

                            if (!dayRecord || (!dayRecord.entries?.length && dayRecord.type === 'work')) {
                              return (
                                <tr key={iso} className="border-b border-purple-50 hover:bg-purple-50/30">
                                  <td className="p-3 font-semibold text-purple-900">{dayLabel}</td>
                                  <td className="p-3 text-purple-300 italic" colSpan={6}>{trans.noData}</td>
                                </tr>
                              )
                            }

                            if (dayRecord.type && dayRecord.type !== 'work') {
                              return (
                                <tr key={iso} className="border-b border-purple-50 hover:bg-purple-50/30">
                                  <td className="p-3 font-semibold text-purple-900">{dayLabel}</td>
                                  <td className="p-3" colSpan={6}>
                                    <DayTypeBadge type={dayRecord.type} label={dayRecord.type.toUpperCase()} />
                                  </td>
                                </tr>
                              )
                            }

                            return dayRecord.entries.map((e, eIdx) => {
                              const duration = parseTimeToMin(e.end) - parseTimeToMin(e.start)
                              const dNet = duration + (parseFloat(e.fahrt) || 0) * 60 - (parseFloat(e.pause) || 0) * 60

                              return (
                                <tr key={`${iso}-${eIdx}`} className="border-b border-purple-50 hover:bg-purple-50/30 text-purple-950">
                                  {eIdx === 0 ? (
                                    <td className="p-3 font-semibold text-purple-900" rowSpan={dayRecord.entries.length}>
                                      {dayLabel}
                                    </td>
                                  ) : null}
                                  <td className="p-3 font-medium">{e.area || '-'}</td>
                                  <td className="p-3 font-mono">{e.start}</td>
                                  <td className="p-3 font-mono">{e.end}</td>
                                  <td className="p-3 font-mono">{e.pause || 0}h</td>
                                  <td className="p-3 font-mono">{e.fahrt || 0}h</td>
                                  <td className="p-3 font-bold text-purple-600 font-mono">{formatTime(dNet)}</td>
                                </tr>
                              )
                            })
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Month */}
              {activeTab === 'month' && (
                <div className="space-y-4">
                  {/* Month Picker (No Print) */}
                  <div className="no-print flex items-center justify-between bg-white rounded-xl border border-purple-100 p-3 shadow-sm">
                    <Button variant="icon" onClick={() => setSelectedMonth(prev => (prev === 0 ? 11 : prev - 1))}>
                      {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </Button>
                    <span className="text-xs font-bold text-purple-900">
                      {MONTHS_OF_YEAR[lang]?.[selectedMonth]} {selectedYear}
                    </span>
                    <Button variant="icon" onClick={() => setSelectedMonth(prev => (prev === 11 ? 0 : prev + 1))}>
                      {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </Button>
                  </div>

                  {/* Month Statistics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { l: trans.totalHours, v: formatTime(monthStats.arb + monthStats.fahr), sub: `${formatTime(monthStats.arb)} + ${formatTime(monthStats.fahr)}`, icon: '⏱' },
                      { l: trans.totalBreak, v: formatTime(monthStats.pause), sub: 'Pause', icon: '☕' },
                      { l: trans.netTime, v: formatTime(monthStats.net), sub: 'Netto', icon: '🏁' },
                      { l: trans.workDays, v: monthStats.workDays, sub: `${monthStats.sickDays} K / ${monthStats.vacation} U`, icon: '🗓' }
                    ].map((s, i) => (
                      <div key={i} className="bg-purple-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">{s.l}</p>
                          <h3 className="text-lg font-black mt-1">{s.v}</h3>
                          <p className="text-[9px] opacity-75 mt-0.5">{s.sub}</p>
                        </div>
                        <span className="text-2xl">{s.icon}</span>
                      </div>
                    ))}
                  </div>

                  {/* Monthly Summary details */}
                  <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4 space-y-3">
                    <SectionHeader>{trans.monthlyReport}</SectionHeader>
                    <div className="grid grid-cols-2 gap-4 text-sm font-medium text-purple-950">
                      <div className="flex justify-between border-b border-purple-50 pb-2">
                        <span>{trans.workDays}:</span>
                        <span className="font-bold">{monthStats.workDays}</span>
                      </div>
                      <div className="flex justify-between border-b border-purple-50 pb-2">
                        <span>{trans.sickDays}:</span>
                        <span className="font-bold text-red-600">{monthStats.sickDays}</span>
                      </div>
                      <div className="flex justify-between border-b border-purple-50 pb-2">
                        <span>{trans.vacationDays}:</span>
                        <span className="font-bold text-indigo-600">{monthStats.vacation}</span>
                      </div>
                      <div className="flex justify-between border-b border-purple-50 pb-2">
                        <span>{trans.holidays}:</span>
                        <span className="font-bold text-blue-600">{monthStats.holidays}</span>
                      </div>
                      <div className="flex justify-between border-b border-purple-50 pb-2 col-span-2">
                        <span>{trans.netTime}:</span>
                        <span className="font-black text-purple-600">{formatTime(monthStats.net)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Salary */}
              {activeTab === 'salary' && (
                <div className="space-y-4">
                  {/* Salary Summary Card */}
                  <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-extrabold text-purple-950">{trans.salary}</h3>
                      <Award className="text-purple-600" />
                    </div>

                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col gap-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-700">{trans.netTime} ({MONTHS_OF_YEAR[lang][selectedMonth]}):</span>
                        <span className="font-bold font-mono text-purple-900">{formatTime(monthStats.net)}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-purple-700">{trans.hourlyRate}:</span>
                        <span className="font-bold font-mono text-purple-900">{formatEuro(hourlyRate)} / h</span>
                      </div>

                      <Divider />

                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-purple-950">Bruttogehalt:</span>
                        <span className="text-xl font-black text-purple-600 font-mono">
                          {formatEuro((monthStats.net / 60) * hourlyRate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
