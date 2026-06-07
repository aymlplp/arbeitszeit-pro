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

  // Print helper
  const handlePrint = () => {
    window.print()
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

                <div className="flex items-center gap-2">
                  {years.length > 1 && (
                    <select
                      value={selectedYear}
                      onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
                      className="bg-white border border-purple-200 rounded-xl px-3 py-1.5 text-xs font-bold text-purple-900 outline-none focus:border-purple-500"
                    >
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  )}
                  <Button variant="ghost" onClick={handlePrint} className="!py-1.5 !px-3 text-xs gap-1">
                    <Printer size={13} />
                    <span>{trans.printReport}</span>
                  </Button>
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
