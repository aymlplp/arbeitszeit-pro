// src/components/Week/EntryTable.jsx
// pause and fahrt: stored as HOURS (0.5 = 30min, 1 = 1h)
import { useCallback } from 'react'
import toast from 'react-hot-toast'
import useAppStore from '@/store/useAppStore'
import { calcEntryMins, minsToHHMM, hoursToHHMM } from '@/lib/utils'

export default function EntryTable({ t, isoKey, dayData }) {
  const { areas, acts, updateDayData } = useAppStore()
  const entries = dayData?.entries || []
  const selType = dayData?.type || 'work'

  const getMins = (timeStr) => {
    if(!timeStr) return 0
    const [h,m] = timeStr.split(':')
    return parseInt(h)*60 + parseInt(m)
  }

  const getAmPm = (timeStr) => {
    if(!timeStr) return ''
    const h = parseInt(timeStr.split(':')[0])
    return h >= 12 ? (t._lang==='ar'?'بعد الظهر':t._lang==='en'?'PM':'Nachm.') 
                   : (t._lang==='ar'?'قبل الظهر':t._lang==='en'?'AM':'Vorm.')
  }

  const getNextAvailableTime = () => {
    if (entries.length === 0) return { start: '08:00', end: '16:00' }
    let maxMins = 0
    let maxTimeStr = '08:00'
    entries.forEach(e => {
      const em = getMins(e.end)
      if (em > maxMins) {
        maxMins = em
        maxTimeStr = e.end
      }
    })
    let newEndMins = maxMins + 60
    if (newEndMins >= 24 * 60) newEndMins = 24 * 60 - 1
    const h = Math.floor(newEndMins / 60).toString().padStart(2, '0')
    const m = (newEndMins % 60).toString().padStart(2, '0')
    return { start: maxTimeStr, end: `${h}:${m}` }
  }

  const checkOverlap = (allEntries, currentEntry, currentIndex) => {
    if (!currentEntry.start || !currentEntry.end) return false;
    const curStart = getMins(currentEntry.start);
    const curEnd = getMins(currentEntry.end);
    if (curStart >= curEnd) return true;

    for (let i = 0; i < allEntries.length; i++) {
      if (i === currentIndex) continue;
      const other = allEntries[i];
      if (!other.start || !other.end) continue;
      const otherStart = getMins(other.start);
      const otherEnd = getMins(other.end);
      
      if (curStart < otherEnd && curEnd > otherStart) {
        return true;
      }
    }
    return false;
  }

  const updateEntry = useCallback((i, field, val) => {
    const parsed = (field==='pause'||field==='fahrt') ? (parseFloat(val)||0) : val
    const newEntry = {...entries[i], [field]: parsed}
    
    if (field === 'area') {
      const selectedAreaObj = areas.find(a => (typeof a === 'string' ? a : a.name) === val);
      if (selectedAreaObj && typeof selectedAreaObj === 'object') {
         if (selectedAreaObj.start) newEntry.start = selectedAreaObj.start;
         if (selectedAreaObj.end) newEntry.end = selectedAreaObj.end;
      }
    }

    const updated = entries.map((e,idx)=> idx===i ? newEntry : e)
    updateDayData(isoKey, {...dayData, entries:updated})
  }, [entries, dayData, isoKey, updateDayData, areas])

  const deleteEntry = useCallback(i => {
    updateDayData(isoKey, {...dayData, entries:entries.filter((_,idx)=>idx!==i)})
  }, [entries, dayData, isoKey, updateDayData])

  const addEntry = useCallback(() => {
    let { start, end } = getNextAvailableTime()
    const firstArea = areas[0] || '';
    const areaName = typeof firstArea === 'string' ? firstArea : firstArea.name;
    
    if (typeof firstArea === 'object') {
       if (firstArea.start) start = firstArea.start;
       if (firstArea.end) end = firstArea.end;
    }
    
    const newEntry = {area: areaName, activity:acts[0]||'', start, end, pause:0, fahrt:0}
    updateDayData(isoKey, {...dayData, entries:[...entries, newEntry]})
  }, [entries, dayData, isoKey, areas, acts, updateDayData])

  const INP = 'w-full bg-purple-50/60 border border-purple-100 rounded-lg px-1.5 py-1.5 text-xs text-center text-purple-900 outline-none focus:border-purple-400 focus:bg-white transition-all'
  const TIME_INP = 'w-full bg-purple-50/60 border border-purple-100 rounded-lg px-0.5 py-1.5 text-sm font-semibold text-center text-purple-900 outline-none focus:border-purple-400 focus:bg-white transition-all tracking-tight'
  const HDR = 'text-[9px] font-bold tracking-wide text-purple-400/70 uppercase'

  const lbl = k => {
    const map = {
      area:     {de:'BEREICH',    en:'AREA',       ar:'المنطقة'},
      activity: {de:'TÄTIGKEIT',  en:'ACTIVITY',   ar:'النشاط'},
      start:    {de:'BEGINN',     en:'START',      ar:'البداية'},
      end:      {de:'ENDE',       en:'END',        ar:'النهاية'},
      pause:    {de:'PAUSE (h)',  en:'BREAK (h)',  ar:'استراحة (س)'},
      fahrt:    {de:'FAHRT (h)',  en:'DRIVE (h)',  ar:'قيادة (س)'},
    }
    return map[k]?.[t._lang||'de'] || map[k]?.de || k
  }

  if (selType !== 'work') {
    return (
      <div className="text-center py-6 text-purple-400 text-sm font-medium">
        {t._lang === 'ar' ? 'إدخال البيانات متاح فقط لأيام العمل.' : 
         t._lang === 'en' ? 'Data entry is only available for work days.' : 
         'Einträge sind nur an Arbeitstagen möglich.'}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="min-w-[480px]">
        {/* Header */}
        <div className="grid gap-1.5 mb-2 items-end" style={{gridTemplateColumns:'minmax(90px, 1.4fr) minmax(70px, 1fr) 95px 95px 60px 60px 28px'}}>
          <span className={HDR}>{lbl('area')}</span>
          <span className={HDR}>{lbl('activity')}</span>
          <span className={`${HDR} text-center`}>{lbl('start')}</span>
          <span className={`${HDR} text-center`}>{lbl('end')}</span>
          <span className={`${HDR} text-center`}>{lbl('pause')}</span>
          <span className={`${HDR} text-center`}>{lbl('fahrt')}</span>
          <span/>
        </div>

        {entries.length===0 && (
        <div className="text-center text-xs text-purple-300 py-2 italic">
          {t.noEntries||'Keine Einträge'}
        </div>
      )}

      {entries.map((e,i) => {
        const mins = calcEntryMins(e)
        const pauseH = parseFloat(e.pause)||0
        const fahrtH = parseFloat(e.fahrt)||0
        return (
          <div key={i} className="grid gap-1.5 mb-1.5 items-center"
            style={{gridTemplateColumns:'minmax(90px, 1.4fr) minmax(70px, 1fr) 95px 95px 60px 60px 28px'}}>

            {/* Area */}
            <select value={e.area||''} onChange={ev=>updateEntry(i,'area',ev.target.value)}
              className={`${INP} text-left`}>
              {areas.map(a=>{
                const name = typeof a === 'string' ? a : a.name;
                return <option key={name} value={name}>{name}</option>
              })}
            </select>

            {/* Activity */}
            <select value={e.activity||''} onChange={ev=>updateEntry(i,'activity',ev.target.value)}
              className={`${INP} text-left text-[10px]`}>
              {acts.map(a=><option key={a}>{a}</option>)}
            </select>

            {/* Start */}
            <div className="relative pb-3">
              <input type="time" step="60" value={e.start||''}
                onChange={ev=>updateEntry(i,'start',ev.target.value)}
                className={`${TIME_INP} ${checkOverlap(entries, e, i) ? 'border-red-400 text-red-600 bg-red-50' : ''}`}/>
              <div className="absolute -bottom-1 left-0 right-0 text-center text-[8.5px] font-medium text-purple-400">
                {getAmPm(e.start)}
              </div>
            </div>

            {/* End + duration */}
            <div className="relative pb-3">
              <input type="time" step="60" value={e.end||''}
                onChange={ev=>updateEntry(i,'end',ev.target.value)}
                className={`${TIME_INP} ${checkOverlap(entries, e, i) ? 'border-red-400 text-red-600 bg-red-50' : ''}`}/>
              {mins>0 ? (
                <div className="absolute -bottom-1 left-0 right-0 text-center text-[9px] font-bold text-purple-500">
                  {minsToHHMM(mins)}
                </div>
              ) : (
                <div className="absolute -bottom-1 left-0 right-0 text-center text-[8.5px] font-medium text-purple-400">
                  {getAmPm(e.end)}
                </div>
              )}
            </div>

            {/* Pause in hours */}
            <div className="relative pb-3">
              <input type="number" min="0" max="12" step="0.5"
                value={e.pause??0}
                onChange={ev=>updateEntry(i,'pause',ev.target.value)}
                className={INP}
                title={pauseH>0 ? hoursToHHMM(pauseH) : ''}/>
              {pauseH>0 && (
                <div className="absolute -bottom-1 left-0 right-0 text-center text-[9px] font-semibold text-orange-500">
                  {hoursToHHMM(pauseH)}
                </div>
              )}
            </div>

            {/* Fahrt in hours */}
            <div className="relative pb-3">
              <input type="number" min="0" max="12" step="0.5"
                value={e.fahrt??0}
                onChange={ev=>updateEntry(i,'fahrt',ev.target.value)}
                className={INP}
                title={fahrtH>0 ? hoursToHHMM(fahrtH) : ''}/>
              {fahrtH>0 && (
                <div className="absolute -bottom-1 left-0 right-0 text-center text-[9px] font-semibold text-blue-500">
                  {hoursToHHMM(fahrtH)}
                </div>
              )}
            </div>

            {/* Delete */}
            <button onClick={()=>deleteEntry(i)}
              className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-all text-sm cursor-pointer self-start mt-0.5">
              ×
            </button>
          </div>
        )
      })}

      <button onClick={addEntry}
        className="mt-2 w-full py-2.5 rounded-xl border-2 border-dashed border-purple-300 text-xs font-bold text-purple-500 hover:bg-purple-50 hover:text-purple-700 transition-all cursor-pointer">
        {t.addEntry||'+ Eintrag hinzufügen'}
      </button>
      </div>
    </div>
  )
}
