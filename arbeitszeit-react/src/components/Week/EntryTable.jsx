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
      // Prioritize 'UR' as the default activity when selecting a work area
      if (acts.includes('UR')) {
        newEntry.activity = 'UR';
      }
    }

    const updated = entries.map((e,idx)=> idx===i ? newEntry : e)
    updateDayData(isoKey, {...dayData, entries:updated})
  }, [entries, dayData, isoKey, updateDayData, areas])

  const deleteEntry = useCallback(i => {
    updateDayData(isoKey, {...dayData, entries:entries.filter((_,idx)=>idx!==i)})
  }, [entries, dayData, isoKey, updateDayData])

  const addEntry = useCallback(() => {
    const { start, end } = getNextAvailableTime()
    const defAct = acts.includes('UR') ? 'UR' : (acts[0] || '')
    const newEntry = {area: '', activity: defAct, start, end, pause:0, fahrt:0}
    updateDayData(isoKey, {...dayData, entries:[...entries, newEntry]})
  }, [entries, dayData, isoKey, acts, updateDayData])

  const INP = 'w-full bg-purple-50/60 border border-purple-100 rounded-lg px-1 py-1 sm:px-1.5 sm:py-1.5 text-[10px] sm:text-xs text-center text-purple-900 outline-none focus:border-purple-400 focus:bg-white transition-all'
  const TIME_INP = 'w-full bg-purple-50/60 border border-purple-100 rounded-lg px-0.5 py-1 sm:py-1.5 text-[11px] sm:text-sm font-semibold text-center text-purple-900 outline-none focus:border-purple-400 focus:bg-white transition-all tracking-tight'
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
    <div className="w-full sm:overflow-x-auto pb-2">
      <div className="w-full sm:min-w-[480px]">
        {/* Header (Visible only on desktop tables) */}
        <div className="hidden sm:grid gap-1.5 mb-2 items-end" style={{gridTemplateColumns:'minmax(90px, 1.4fr) minmax(70px, 1fr) 95px 95px 60px 60px 28px'}}>
          <span className={HDR}>{lbl('area')}</span>
          <span className={HDR}>{lbl('activity')}</span>
          <span className={`${HDR} text-center`}>{lbl('start')}</span>
          <span className={`${HDR} text-center`}>{lbl('end')}</span>
          <span className={`${HDR} text-center`}>{lbl('pause')}</span>
          <span className={`${HDR} text-center`}>{lbl('fahrt')}</span>
          <span/>
        </div>

        {entries.length===0 && (
          <div className="text-center text-xs text-purple-300 py-3 italic">
            {t.noEntries||'Keine Einträge'}
          </div>
        )}

        {entries.map((e, i) => {
          const mins = calcEntryMins(e)
          const pauseH = parseFloat(e.pause)||0
          const fahrtH = parseFloat(e.fahrt)||0
          return (
            <div key={i} 
              className="grid grid-cols-12 gap-x-1 gap-y-1.5 sm:gap-y-0 items-center p-2.5 sm:p-0 mb-2.5 sm:mb-1.5 rounded-2xl sm:rounded-none bg-white/65 sm:bg-transparent border border-purple-100/70 sm:border-none shadow-[0_3px_10px_rgba(124,58,237,0.02)] sm:shadow-none sm:grid-cols-[minmax(90px,1.4fr)_minmax(70px,1fr)_95px_95px_60px_60px_28px]">

              {/* Area */}
              <div className="col-span-9 sm:col-auto flex flex-col gap-0.5">
                <span className="text-[8px] font-extrabold tracking-wider text-purple-400/80 sm:hidden uppercase px-1">{lbl('area')}</span>
                <select value={e.area||''} onChange={ev=>updateEntry(i,'area',ev.target.value)}
                  className={`${INP} text-left ${!e.area ? '!text-purple-400 italic' : ''}`}>
                  <option value="">{t._lang==='ar'?'--- اختر ---':t._lang==='en'?'--- Select ---':'--- Wählen ---'}</option>
                  {areas.map(a=>{
                    const name = typeof a === 'string' ? a : a.name;
                    return <option key={name} value={name}>{name}</option>
                  })}
                </select>
              </div>

              {/* Activity */}
              <div className="col-span-3 sm:col-auto flex flex-col gap-0.5">
                <span className="text-[8px] font-extrabold tracking-wider text-purple-400/80 sm:hidden uppercase px-1">{lbl('activity')}</span>
                <select value={e.activity||''} onChange={ev=>updateEntry(i,'activity',ev.target.value)}
                  className={`${INP} text-left text-[10px]`}>
                  {acts.map(a=><option key={a}>{a}</option>)}
                </select>
              </div>

              {/* Start */}
              <div className="col-span-3 sm:col-auto flex flex-col gap-0.5 relative pb-3 sm:pb-3">
                <span className="text-[8px] font-extrabold tracking-wider text-purple-400/80 sm:hidden uppercase px-1 text-center truncate">{lbl('start')}</span>
                <input type="time" step="60" value={e.start||''}
                  onChange={ev=>updateEntry(i,'start',ev.target.value)}
                  className={`${TIME_INP} ${checkOverlap(entries, e, i) ? 'border-red-400 text-red-600 bg-red-50' : ''}`}/>
                <div className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-medium text-purple-400 truncate px-0.5">
                  {getAmPm(e.start)}
                </div>
              </div>

              {/* End + duration */}
              <div className="col-span-3 sm:col-auto flex flex-col gap-0.5 relative pb-3 sm:pb-3">
                <span className="text-[8px] font-extrabold tracking-wider text-purple-400/80 sm:hidden uppercase px-1 text-center truncate">{lbl('end')}</span>
                <input type="time" step="60" value={e.end||''}
                  onChange={ev=>updateEntry(i,'end',ev.target.value)}
                  className={`${TIME_INP} ${checkOverlap(entries, e, i) ? 'border-red-400 text-red-600 bg-red-50' : ''}`}/>
                {mins>0 ? (
                  <div className="absolute bottom-0 left-0 right-0 text-center text-[8.5px] font-bold text-purple-500">
                    {minsToHHMM(mins)}
                  </div>
                ) : (
                  <div className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-medium text-purple-400 truncate px-0.5">
                    {getAmPm(e.end)}
                  </div>
                )}
              </div>

              {/* Pause in hours with custom stepper */}
              <div className="col-span-2 sm:col-auto flex flex-col gap-0.5 relative pb-3 sm:pb-3">
                <span className="text-[8px] font-extrabold tracking-wider text-purple-400/80 sm:hidden uppercase text-center truncate">{t._lang==='ar'?'استراحة':t._lang==='en'?'Break':'Pause'}</span>
                <div className="w-full flex items-center bg-purple-50/60 border border-purple-100 rounded-lg overflow-hidden h-[28px] sm:h-[32px] focus-within:border-purple-400 focus-within:bg-white transition-all">
                  <button 
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(e.pause) || 0;
                      const next = Math.max(0, cur - 0.5);
                      updateEntry(i, 'pause', next);
                    }}
                    className="w-5 h-full bg-purple-100/30 hover:bg-purple-200/50 flex items-center justify-center text-xs font-black text-purple-600 border-r border-purple-100 select-none active:scale-90 transition-transform cursor-pointer"
                  >
                    -
                  </button>
                  <input type="number" min="0" max="12" step="0.5"
                    value={e.pause??0}
                    onChange={ev=>updateEntry(i,'pause',ev.target.value)}
                    className="w-full bg-transparent border-0 text-[10px] sm:text-xs text-center text-purple-900 outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    title={pauseH>0 ? hoursToHHMM(pauseH) : ''}/>
                  <button 
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(e.pause) || 0;
                      const next = Math.min(12, cur + 0.5);
                      updateEntry(i, 'pause', next);
                    }}
                    className="w-5 h-full bg-purple-100/30 hover:bg-purple-200/50 flex items-center justify-center text-xs font-black text-purple-600 border-l border-purple-100 select-none active:scale-90 transition-transform cursor-pointer"
                  >
                    +
                  </button>
                </div>
                {pauseH>0 && (
                  <div className="absolute bottom-0 left-0 right-0 text-center text-[8.5px] font-semibold text-orange-500">
                    {hoursToHHMM(pauseH)}
                  </div>
                )}
              </div>

              {/* Fahrt in hours with custom stepper */}
              <div className="col-span-2 sm:col-auto flex flex-col gap-0.5 relative pb-3 sm:pb-3">
                <span className="text-[8px] font-extrabold tracking-wider text-purple-400/80 sm:hidden uppercase text-center truncate">{t._lang==='ar'?'قيادة':t._lang==='en'?'Drive':'Fahrt'}</span>
                <div className="w-full flex items-center bg-purple-50/60 border border-purple-100 rounded-lg overflow-hidden h-[28px] sm:h-[32px] focus-within:border-purple-400 focus-within:bg-white transition-all">
                  <button 
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(e.fahrt) || 0;
                      const next = Math.max(0, cur - 0.5);
                      updateEntry(i, 'fahrt', next);
                    }}
                    className="w-5 h-full bg-purple-100/30 hover:bg-purple-200/50 flex items-center justify-center text-xs font-black text-purple-600 border-r border-purple-100 select-none active:scale-90 transition-transform cursor-pointer"
                  >
                    -
                  </button>
                  <input type="number" min="0" max="12" step="0.5"
                    value={e.fahrt??0}
                    onChange={ev=>updateEntry(i,'fahrt',ev.target.value)}
                    className="w-full bg-transparent border-0 text-[10px] sm:text-xs text-center text-purple-900 outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    title={fahrtH>0 ? hoursToHHMM(fahrtH) : ''}/>
                  <button 
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(e.fahrt) || 0;
                      const next = Math.min(12, cur + 0.5);
                      updateEntry(i, 'fahrt', next);
                    }}
                    className="w-5 h-full bg-purple-100/30 hover:bg-purple-200/50 flex items-center justify-center text-xs font-black text-purple-600 border-l border-purple-100 select-none active:scale-90 transition-transform cursor-pointer"
                  >
                    +
                  </button>
                </div>
                {fahrtH>0 && (
                  <div className="absolute bottom-0 left-0 right-0 text-center text-[8.5px] font-semibold text-blue-500">
                    {hoursToHHMM(fahrtH)}
                  </div>
                )}
              </div>

              {/* Delete */}
              <div className="col-span-2 sm:col-auto flex flex-col justify-center items-center sm:pt-0 pt-2.5">
                <button onClick={()=>deleteEntry(i)}
                  className="w-7 h-7 rounded-xl bg-red-50 sm:bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 transition-all text-sm cursor-pointer">
                  ×
                </button>
              </div>
            </div>
          )
        })}

        <button onClick={addEntry}
          className="mt-2.5 w-full py-2 sm:py-2.5 rounded-xl border-2 border-dashed border-purple-300 text-[11px] sm:text-xs font-bold text-purple-500 hover:bg-purple-50 hover:text-purple-700 transition-all cursor-pointer">
          {t.addEntry||'+ Eintrag hinzufügen'}
        </button>
      </div>
    </div>
  )
}
