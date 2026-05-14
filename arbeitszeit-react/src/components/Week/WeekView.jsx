// src/components/Week/WeekView.jsx
import { useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '@/store/useAppStore'
import { DAY_SHORT, DAY_FULL, MONTHS } from '@/lib/i18n'
import {
  getWeekDates, getISODate, getKW, getMondayByOffset,
  formatDDMM, formatFull, minsToHHMM, minsToStd,
  calcEntryMins, calcWeekTotals,
} from '@/lib/utils'
import { NavCircle, DayTypeBadge, SumBox, Pill } from '@/components/UI'
import EntryTable from './EntryTable'

const BADGE_LABELS = {
  de: { work:'ARBEITSTAG', sick:'KRANK',  holiday:'FEIERTAG', vacation:'URLAUB' },
  en: { work:'WORK DAY',   sick:'SICK',   holiday:'HOLIDAY',  vacation:'VACATION' },
  ar: { work:'يوم عمل',   sick:'مريض',   holiday:'عطلة',     vacation:'إجازة سنوية' },
}
const TYPE_OPT = {
  de: [['work','Arbeitstag'],['sick','Krankheit'],['holiday','Feiertag'],['vacation','Urlaub']],
  en: [['work','Work Day'],  ['sick','Sick'],      ['holiday','Holiday'],  ['vacation','Vacation']],
  ar: [['work','يوم عمل'],  ['sick','مريض'],      ['holiday','عطلة'],    ['vacation','إجازة']],
}

export default function WeekView({ t }) {
  const { aData, weekOffset, selDay, lang, setWeekOffset, setSelDay, updateDayData } = useAppStore()
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const today     = useMemo(() => { const d=new Date(); d.setHours(0,0,0,0); return d }, [])
  const totals    = useMemo(() => calcWeekTotals(weekDates, aData), [weekDates, aData])
  const monday    = getMondayByOffset(weekOffset)
  const kw        = getKW(monday)
  const sun       = weekDates[6]
  const months    = MONTHS[lang]
  const dayShort  = DAY_SHORT[lang]
  const selIdx    = selDay < 0 ? (today.getDay()===0?6:today.getDay()-1) : selDay
  const selDate   = weekDates[selIdx]
  const selKey    = selDate ? getISODate(selDate) : null
  const selData   = selKey ? (aData[selKey] || { type:'work', entries:[] }) : null
  const selType   = selData?.type || 'work'

  // Inject lang into t so EntryTable can use it
  const tWithLang = useMemo(() => ({ ...t, _lang: lang }), [t, lang])

  const goToday = useCallback(() => {
    setWeekOffset(0)
    const d = today.getDay()
    setSelDay(d===0?6:d-1)
  }, [today, setWeekOffset, setSelDay])

  const changeDayType = useCallback(val => {
    if (!selKey) return
    updateDayData(selKey, { ...(aData[selKey]||{type:'work',entries:[]}), type: val })
  }, [selKey, aData, updateDayData])

  const PILL_DATA = [
    { label: lang==='ar'?'أيام العمل':lang==='en'?'Work days':'Arbeitstage',     value: totals.workDays },
    { label: lang==='ar'?'مريض':lang==='en'?'Sick':'Krankheitstage',             value: totals.sickDays },
    { label: lang==='ar'?'عطلة':lang==='en'?'Holidays':'Feiertage',              value: totals.holidays },
    { label: lang==='ar'?'إجازة':lang==='en'?'Vacation':'Urlaub',               value: totals.vacation },
  ]

  const lbl = {
    today:  lang==='ar'?'اليوم':lang==='en'?'Today':'Zu Heute',
    week:   lang==='ar'?'ملخص الأسبوع':lang==='en'?'Weekly Overview':'Wochenübersicht',
    wt:     lang==='ar'?'ساعات العمل':lang==='en'?'Work Time':'Arbeitszeit',
    dr:     lang==='ar'?'القيادة':lang==='en'?'Drive Time':'Fahrzeit',
    br:     lang==='ar'?'الاستراحة':lang==='en'?'Total Break':'Pause Gesamt',
    net:    lang==='ar'?'الصافي':lang==='en'?'Net':'Netto',
  }

  return (
    <div className="space-y-3">
      {/* Week nav */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <NavCircle onClick={() => { setWeekOffset(weekOffset-1); setSelDay(-1) }}>‹</NavCircle>
          <button onClick={goToday}
            className="bg-pink-500 text-white border-none rounded-full px-4 py-1.5 text-sm font-bold cursor-pointer shadow-md shadow-pink-500/40 hover:bg-pink-600 transition-all">
            {lbl.today}
          </button>
          <NavCircle onClick={() => { setWeekOffset(weekOffset+1); setSelDay(-1) }}>›</NavCircle>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-bold tracking-widest text-purple-600 uppercase mb-0.5">KW{kw}</div>
          <div className="bg-white/55 border border-purple-200 rounded-full px-3 py-1 text-xs font-medium text-purple-700">
            {formatDDMM(monday)}{months[monday.getMonth()].slice(0,3)} – {formatDDMM(sun)}{months[sun.getMonth()].slice(0,3)}. {sun.getFullYear()}
          </div>
        </div>
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDates.map((d, i) => {
          const k   = getISODate(d)
          const dd  = aData[k] || {}
          const isT = d.getTime()===today.getTime()
          const isSel = i===selIdx
          const mins  = (dd.entries||[]).reduce((s,e)=>s+calcEntryMins(e),0)
          const typ   = dd.type&&dd.type!=='work'?dd.type:''
          const DOT   = {sick:'#ef9a9a',holiday:'#90caf9',vacation:'#a5d6a7'}
          return (
            <motion.div key={k} whileTap={{scale:0.93}}
              onClick={()=>{ setSelDay(i); setWeekOffset(weekOffset) }}
              className={`relative rounded-xl p-2 text-center cursor-pointer select-none transition-all
                ${isT  ? 'text-white' : isSel ? 'bg-purple-100 border border-purple-400 text-purple-900'
                  : 'bg-white/55 border border-white/50 text-purple-900 hover:bg-white/78'}`}
              style={isT?{background:'#1e1854'}:{}}>
              {isT && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  {lang==='ar'?'اليوم':lang==='en'?'Today':'Heute'}
                </div>
              )}
              <div className={`text-[9px] font-bold uppercase tracking-wide ${isT?'text-white/65':'text-purple-500/60'}`}>{dayShort[i]}</div>
              <div className={`text-sm font-bold mt-0.5 mb-0.5 ${isT?'text-white':''}`}>{d.getDate()}.</div>
              {mins>0 ? (
                <div className={`text-[10px] font-semibold ${isT?'text-pink-300':'text-purple-500'}`}>{minsToHHMM(mins)}</div>
              ) : typ ? (
                <div className="w-1.5 h-1.5 rounded-full mx-auto mt-0.5" style={{background:DOT[typ]||'#ccc'}}/>
              ) : (
                <div className={`w-1 h-1 rounded-full mx-auto mt-0.5 ${isT?'bg-pink-300/80':'bg-purple-400/35'}`}/>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Day detail */}
      <AnimatePresence mode="wait">
        {selDate && (
          <motion.div key={selKey}
            initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}}
            className="glass-light rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{background:'linear-gradient(135deg,#c8b8f0,#a89de8)'}}>📅</div>
                <div>
                  <div className="text-base font-bold text-purple-900">{DAY_FULL[lang][selIdx]}</div>
                  <div className="text-xs text-purple-500">{formatFull(selDate, months)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DayTypeBadge type={selType} label={(BADGE_LABELS[lang]||BADGE_LABELS.de)[selType]}/>
                <select value={selType} onChange={e=>changeDayType(e.target.value)}
                  className="bg-purple-50 border border-purple-200 rounded-lg px-2 py-1 text-xs text-purple-700 outline-none focus:border-purple-500">
                  {(TYPE_OPT[lang]||TYPE_OPT.de).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <EntryTable t={tWithLang} isoKey={selKey} dayData={selData}/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      <div className="rounded-2xl p-5 text-white" style={{background:'#1e1854'}}>
        <div className="flex items-center gap-2 text-sm font-bold mb-4">✦ {lbl.week}</div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          <SumBox label={lbl.wt}  value={minsToHHMM(totals.arb)}   sub={minsToStd(totals.arb)}/>
          <SumBox label={lbl.dr}  value={minsToHHMM(totals.fahr)}  sub={minsToStd(totals.fahr)}/>
          <SumBox label={lbl.br}  value={minsToHHMM(totals.pause)} sub={minsToStd(totals.pause)}/>
          <SumBox label={lbl.net} value={minsToHHMM(totals.net)}   sub={minsToStd(totals.net)} highlight/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {PILL_DATA.map(p=><Pill key={p.label} label={p.label} value={p.value}/>)}
        </div>
      </div>
    </div>
  )
}
