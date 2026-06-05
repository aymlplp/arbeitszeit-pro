// src/components/Reports/ReportsView.jsx
import { useState, useMemo, useCallback } from 'react'
import useAppStore from '@/store/useAppStore'
import { DAY_FULL, MONTHS } from '@/lib/i18n'
import { getWeekDates, getISODate, getKW, getMondayByOffset, minsToHHMM } from '@/lib/utils'
import { NavCircle } from '@/components/UI'
import toast from 'react-hot-toast'
import { startCheckout } from '@/lib/auth'

const RCLS = { sick:'rsk', holiday:'rho', vacation:'rva' }

const PRINT_CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
body{font-family:Arial,sans-serif;padding:10px;background:#fff;color:#222;}
table{border-collapse:collapse;width:100%;font-size:10px;}
th,td{border:1px solid #bbb;padding:3px 5px;text-align:center;white-space:nowrap;}
.r1{background:#F5A623!important;color:#412402!important;font-weight:bold;}
.r2{background:#FAD07A!important;color:#633806!important;font-weight:bold;}
.rg{background:#C8E6A0!important;color:#27500A!important;}
.rbl{background:#B5D4F4!important;color:#0C447C!important;}
.ro{background:#F5C4B3!important;color:#712B13!important;}
.rtot{background:#4CAF50!important;color:#fff!important;font-weight:bold;}
.rsk{background:#FCEBEB!important;color:#A32D2D!important;}
.rho{background:#E6F1FB!important;color:#185FA5!important;}
.rva{background:#EAF3DE!important;color:#3B6D11!important;}
.sig-box{margin-top:30px;page-break-inside:avoid;display:flex;justify-content:flex-end;}
.sig-img{max-height:80px;border-bottom:1px solid #222;padding-bottom:5px;}
.pb2{page-break-after:always;}
@media print{@page{size:A4 landscape;margin:8mm;}}
`

export default function ReportsView({ t }) {
  const { aData, lang, settings, currentUser } = useAppStore()
  const isPro = currentUser?.plan?.toLowerCase() === 'pro'
  const [repType, setRepType] = useState('wk')
  const [rWO, setRWO] = useState(0)
  const [rMO, setRMO] = useState(0)
  const [rYO, setRYO] = useState(0)

  const co     = settings.co   || ''
  const em     = settings.name || ''
  const months = MONTHS[lang]
  const dayFull= DAY_FULL[lang]

  // ── helpers ──────────────────────────────────────────────────────
  const fmt  = d => `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.`
  const fmtY = d => fmt(d)+d.getFullYear()
  // fH: minutes → "Xh" label
  const fH   = m => { if(!m||m===0)return'0h'; const hh=(m/60); return hh===Math.floor(hh)?Math.floor(hh)+'h':hh.toFixed(2)+'h' }

  const pT = s => {
    if (!s||!s.trim()) return 0
    const m=s.trim().match(/^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})$/)
    if(!m)return 0
    let d=(+m[3]*60+ +m[4])-(+m[1]*60+ +m[2]); return(d<0?d+1440:d)/60
  }
  const cA  = e => (e.days||[]).reduce((s,d)=>s+pT(d),0)
  const gMon= o => { const d=new Date(getMondayByOffset(0)); d.setDate(d.getDate()+o*7); return d }
  const wKey= o => gMon(o).toISOString().slice(0,10)
  const gDts= o => getWeekDates(o)

  // wSum: returns totals in MINUTES (fahr/pause stored as hours → ×60)
  const wSum = k => {
    const d=aData[k]; if(!d)return{arb:0,fahr:0,pause:0,tot:0,wt:0,sk:0,hl:0,vc:0}
    let a=0,f=0,p=0
    ;(d.entries||[]).forEach(e=>{
      const mins = (() => {
        if(e.start&&e.end){const t=(+e.end.split(':')[0]*60+ +e.end.split(':')[1])-(+e.start.split(':')[0]*60+ +e.start.split(':')[1]); return t>0?t:0}
        return (e.days||[]).reduce((s,dd)=>s+pT(dd),0)*60
      })()
      if(e.days) { a+=cA(e)*60 } else { a+=mins }
      f+=(parseFloat(e.fahrt)||0)*60
      p+=(parseFloat(e.pause)||0)*60
    })
    const typ=d.type||'work'
    return{
      arb:a, fahr:f, pause:p, tot:a+f-p,
      wt: a>0&&typ==='work'?1:0,
      sk: typ==='sick'?1:0,
      hl: typ==='holiday'?1:0,
      vc: typ==='vacation'?1:0,
    }
  }

  const L = {
    obj:  {de:'Objekt',      en:'Site',        ar:'الموقع'},
    tat:  {de:'Tätigkeit',   en:'Activity',    ar:'النشاط'},
    ges:  {de:'Gesamt',      en:'Total',       ar:'الإجمالي'},
    arb:  {de:'Arbeitszeit', en:'Work Time',   ar:'ساعات العمل'},
    fahr: {de:'Fahrzeit',    en:'Drive Time',  ar:'القيادة'},
    pau:  {de:'Pause',       en:'Break',       ar:'الاستراحة'},
    mit:  {de:'Mitarbeiter', en:'Employee',    ar:'الموظف'},
    mo2:  {de:'Monatsübersicht',en:'Month Overview',ar:'ملخص الشهر'},
    gmo:  {de:'GESAMT MONAT',en:'MONTH TOTAL', ar:'الإجمالي الشهري'},
    mob:  {de:'Monatsbericht',en:'Monthly Report',ar:'التقرير الشهري'},
    jb:   {de:'Jahresbericht',en:'Yearly Report', ar:'التقرير السنوي'},
    kw:   {de:'KW',          en:'CW',          ar:'أسبوع'},
    wo:   {de:'Woche',       en:'Week',        ar:'الأسبوع'},
    mon:  {de:'Monat',       en:'Month',       ar:'الشهر'},
    lw:   {de:'Arbeitstage', en:'Work Days',   ar:'أيام العمل'},
    ls:   {de:'Krankheitstage',en:'Sick Days', ar:'أيام المرض'},
    lh:   {de:'Feiertage',   en:'Holidays',    ar:'أيام العطل'},
    lv:   {de:'Urlaub',      en:'Vacation',    ar:'الإجازة'},
    noE:  {de:'Keine Einträge',en:'No entries',ar:'لا إدخالات'},
  }
  const g = k => L[k]?.[lang]||L[k]?.de||k

  // ── day-type summary table ────────────────────────────────────────
  const daySummary = keys => {
    let wt=0,sk=0,hl=0,vc=0
    keys.forEach(k=>{ const s=wSum(k); wt+=s.wt;sk+=s.sk;hl+=s.hl;vc+=s.vc })
    return `
    <table class="rt" style="margin-top:10px;max-width:400px">
      <thead>
        <tr>
          <th class="r2" style="width:25%">${g('lw')}</th>
          <th style="background:#FCEBEB!important;color:#A32D2D!important;font-weight:600;width:25%">${g('ls')}</th>
          <th style="background:#E6F1FB!important;color:#185FA5!important;font-weight:600;width:25%">${g('lh')}</th>
          <th style="background:#EAF3DE!important;color:#3B6D11!important;font-weight:600;width:25%">${g('lv')}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight:700;font-size:15px;padding:7px;background:#FAD07A;color:#633806">${wt}</td>
          <td style="font-weight:700;font-size:15px;padding:7px;background:#FCEBEB;color:#A32D2D">${sk}</td>
          <td style="font-weight:700;font-size:15px;padding:7px;background:#E6F1FB;color:#185FA5">${hl}</td>
          <td style="font-weight:700;font-size:15px;padding:7px;background:#EAF3DE;color:#3B6D11">${vc}</td>
        </tr>
      </tbody>
    </table>`
  }

  // ── wkTbl: one week HTML table (v10 style) ────────────────────────
  const wkTbl = useCallback((off, showHdr) => {
    const dts  = gDts(off)
    const kw   = getKW(dts[0])
    const dn   = lang==='ar'?3:2

    let tA=0, tf=0, tp2=0
    let dA=Array(7).fill(0), dF=Array(7).fill(0), dP=Array(7).fill(0)
    let rows = ''
    
    dts.forEach((d, i) => {
      const k = getISODate(d)
      const dayData = aData[k] || {}
      const typ = dayData.type || 'work'

      if (typ !== 'work') {
        const letter = typ === 'sick' ? (lang === 'ar' ? 'م' : lang === 'en' ? 'S' : 'K') :
                       typ === 'holiday' ? (lang === 'ar' ? 'ع' : lang === 'en' ? 'H' : 'F') :
                       typ === 'vacation' ? (lang === 'ar' ? 'إ' : lang === 'en' ? 'V' : 'U') : ''
        let cells = Array(7).fill('<td></td>')
        cells[i] = `<td class="${RCLS[typ]||''}" style="font-weight:bold;font-size:12px">${letter}</td>`
        rows += `<tr>
          <td colspan="2"></td>
          ${cells.join('')}
          <td class="rg"></td>
        </tr>`
      } else {
        ;(dayData.entries || []).forEach(e => {
          let cells = Array(7).fill('<td></td>')
          if (e.days) {
            cells = e.days.map((dd, idx) => {
              const rc=RCLS[(e.tg||[])[idx]]||''
              return `<td${rc?` class="${rc}"`:''}  style="font-size:10px;font-family:monospace">${dd||''}</td>`
            })
            tA += cA(e)*60
          } else {
            const range=e.start&&e.end?`${e.start}–${e.end}`:''
            cells[i] = `<td style="font-size:10px;font-family:monospace;font-weight:600">${range}</td>`
            const mins=(()=>{if(e.start&&e.end){const t=(+e.end.split(':')[0]*60+ +e.end.split(':')[1])-(+e.start.split(':')[0]*60+ +e.start.split(':')[1]);return t>0?t:0}return 0})()
            tA += mins
            dA[i] += mins
          }
          
          tf += (parseFloat(e.fahrt)||0)*60
          dF[i] += (parseFloat(e.fahrt)||0)*60
          
          tp2 += (parseFloat(e.pause)||0)*60
          dP[i] += (parseFloat(e.pause)||0)*60
          
          const ar = e.days ? cA(e)*60 : (()=>{if(e.start&&e.end){const t=(+e.end.split(':')[0]*60+ +e.end.split(':')[1])-(+e.start.split(':')[0]*60+ +e.start.split(':')[1]);return t>0?t:0}return 0})()
          rows += `<tr>
            <td style="text-align:left;font-weight:500">${e.obj||e.area||''}</td>
            <td>${e.taet||e.activity||''}</td>
            ${cells.join('')}
            <td class="rg" style="font-weight:500">${ar>0?fH(ar):''}</td>
          </tr>`
        })
      }
    })

    if(!rows) rows=`<tr><td colspan="10" style="text-align:center;color:#888;padding:5px">${g('noE')}</td></tr>`

    const hdrs = dayFull.map((dd,i)=>
      `<th class="r2">${dd.slice(0,dn)}<br><span style="font-weight:400;font-size:9px">${fmt(dts[i])}</span></th>`
    ).join('')

    const hdr = showHdr
      ? `<tr><th colspan="10" class="r1" style="text-align:left;padding:5px 7px;font-size:12px">${co}${settings.phone?` &nbsp;|&nbsp; ${settings.phone}`:''}</th></tr>
         <tr><th colspan="5" class="r1" style="text-align:left;padding:3px 7px">${g('mit')}: ${em}</th><th colspan="5" class="r1" style="text-align:right;padding:3px 7px;font-size:10px">${settings.email||''}</th></tr>`
      : ''

    return `
    <thead>
      ${hdr}
      <tr><th colspan="10" class="r2" style="text-align:left;padding:3px 7px">KW ${kw} | ${fmt(dts[0])} – ${fmtY(dts[6])}</th></tr>
      <tr>
        <th class="r2" style="text-align:left">${g('obj')}</th>
        <th class="r2">${g('tat')}</th>
        ${hdrs}
        <th class="r2">${g('ges')}</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr>
        <td colspan="2" class="rg" style="text-align:right;font-weight:500">${g('arb')}</td>
        ${dA.map(v => `<td class="rg">${v>0?fH(v):''}</td>`).join('')}
        <td class="rg">${fH(tA)}</td>
      </tr>
      <tr>
        <td colspan="2" class="rbl" style="text-align:right;font-weight:500">${g('fahr')}</td>
        ${dF.map(v => `<td class="rbl">${v>0?fH(v):''}</td>`).join('')}
        <td class="rbl">${fH(tf)}</td>
      </tr>
      <tr>
        <td colspan="2" class="ro" style="text-align:right;font-weight:500">${g('pau')}</td>
        ${dP.map(v => `<td class="ro">${v>0?fH(v):''}</td>`).join('')}
        <td class="ro">${fH(tp2)}</td>
      </tr>
      <tr>
        <td colspan="9" style="text-align:right;font-weight:500;background:#f5f5f5">${g('ges')} KW ${kw}</td>
        <td class="rtot">${fH(tA+tf-tp2)}</td>
      </tr>
    </tbody>`
  }, [aData, lang, co, em, settings, dayFull])

  // ── 1. Wochenbericht ──────────────────────────────────────────────
  const buildWk = useCallback(() => {
    const dts=gDts(rWO), kw=getKW(dts[0])
    const period=`KW${kw} ${fmt(dts[0])}–${fmtY(dts[6])}`
    const allKeys = dts.map(d => getISODate(d))
    const html=`<div style="overflow-x:auto"><table class="rt">${wkTbl(rWO,true)}</table></div>${daySummary(allKeys)}`
    return{period,html}
  },[rWO,wkTbl])

  // ── 2. Monat kombiniert ───────────────────────────────────────────
  const buildMC = useCallback(() => {
    const base=new Date(); base.setMonth(base.getMonth()+rMO); base.setDate(1)
    const period=`${months[base.getMonth()]} ${base.getFullYear()}`
    const weeks=[]
    for(let i=-60;i<60;i++){const mm=gMon(i);if(mm.getFullYear()===base.getFullYear()&&mm.getMonth()===base.getMonth()&&!weeks.includes(i))weeks.push(i)}
    weeks.sort((a,b)=>a-b)
    let mA=0,mF=0,mP=0
    const allKeys=[]
    weeks.forEach(w=>{
      gDts(w).forEach(d => {
        const k = getISODate(d)
        allKeys.push(k)
        const s = wSum(k)
        mA+=s.arb;mF+=s.fahr;mP+=s.pause
      })
    })
    let html=''
    if(!weeks.length){html=`<div style="text-align:center;padding:16px;color:#888">${g('noE')}</div>`}
    else{
      for(let pi=0;pi<weeks.length;pi+=2){
        const pair=weeks.slice(pi,pi+2),isLast=pi+2>=weeks.length
        html+=`<div${isLast?'':' class="pb2"'}>`
        pair.forEach((wo,idx)=>html+=`<table class="rt" style="margin-bottom:${idx===0&&pair.length>1?'14px':'0'}">${wkTbl(wo,pi===0&&idx===0)}</table>`)
        html+=`</div>`
      }
    }
    html+=`
    <table class="rt" style="margin-top:12px">
      <thead><tr><th colspan="10" class="r1" style="text-align:left;padding:5px 7px">${g('mo2')}: ${months[base.getMonth()]} ${base.getFullYear()}</th></tr></thead>
      <tbody>
        <tr><td colspan="9" class="rg"  style="text-align:right;font-weight:500">${g('arb')}</td><td class="rg" >${fH(mA)}</td></tr>
        <tr><td colspan="9" class="rbl" style="text-align:right;font-weight:500">${g('fahr')}</td><td class="rbl">${fH(mF)}</td></tr>
        <tr><td colspan="9" class="ro"  style="text-align:right;font-weight:500">${g('pau')}</td><td class="ro" >${fH(mP)}</td></tr>
        <tr><td colspan="9" style="text-align:right;font-weight:500;background:#f5f5f5">${g('gmo')}</td><td class="rtot" style="font-size:13px">${fH(mA+mF-mP)}</td></tr>
      </tbody>
    </table>
    ${daySummary(allKeys)}`
    return{period,html}
  },[rMO,aData,wkTbl,months,lang])

  // ── 3. Monatsbericht ─────────────────────────────────────────────
  const buildMo = useCallback(() => {
    const base=new Date(); base.setMonth(base.getMonth()+rMO); base.setDate(1)
    const period=`${months[base.getMonth()]} ${base.getFullYear()}`
    let tA=0,tF=0,tP=0; const wr=[],allKeys=[]
    Object.keys(aData).forEach(k=>{
      const d=new Date(k)
      if(d.getFullYear()===base.getFullYear()&&d.getMonth()===base.getMonth()){
        allKeys.push(k)
        const s=wSum(k); const sun=new Date(d); sun.setDate(d.getDate()+6)
        wr.push({kw:getKW(d),range:`${fmt(d)}–${fmt(sun)}`,...s})
        tA+=s.arb;tF+=s.fahr;tP+=s.pause
      }
    })
    wr.sort((a,b)=>a.kw-b.kw)
    let rows=wr.map(w=>`<tr><td>KW ${w.kw}</td><td>${w.range}</td><td>${fH(w.arb)}</td><td class="rbl">${fH(w.fahr)}</td><td class="ro">${fH(w.pause)}</td><td style="font-weight:500">${fH(w.tot)}</td></tr>`).join('')
    if(!rows)rows=`<tr><td colspan="6" style="text-align:center;color:#888">${g('noE')}</td></tr>`
    const html=`<div style="overflow-x:auto"><table class="rt">
      <thead>
        <tr><th colspan="6" class="r1" style="text-align:left;padding:5px 7px">${co}</th></tr>
        <tr><th colspan="3" class="r1" style="text-align:left;padding:3px 7px">${g('mit')}: ${em}</th><th colspan="3" class="r1">${g('mob')}: ${months[base.getMonth()]} ${base.getFullYear()}</th></tr>
        <tr><th class="r2">KW</th><th class="r2">${g('wo')}</th><th class="r2">${g('arb')}</th><th class="r2 rbl">${g('fahr')}</th><th class="r2 ro">${g('pau')}</th><th class="r2">${g('ges')}</th></tr>
      </thead>
      <tbody>
        ${rows}
        <tr><td colspan="2" class="rg" style="text-align:right;font-weight:500">${g('ges')}</td><td class="rg">${fH(tA)}</td><td class="rbl">${fH(tF)}</td><td class="ro">${fH(tP)}</td><td class="rtot">${fH(tA+tF-tP)}</td></tr>
      </tbody>
    </table></div>${daySummary(allKeys)}`
    return{period,html}
  },[rMO,aData,months,co,em,lang])

  // ── 4. Jahresbericht ─────────────────────────────────────────────
  const buildYr = useCallback(() => {
    const year=new Date().getFullYear()+rYO
    const period=`${g('jb').split(' ')[0]} ${year}`
    const md=Array.from({length:12},()=>({arb:0,fahr:0,pause:0}))
    const allKeys=[]
    Object.keys(aData).forEach(k=>{
      const d=new Date(k)
      if(d.getFullYear()===year){
        allKeys.push(k)
        const s=wSum(k)
        md[d.getMonth()].arb+=s.arb; md[d.getMonth()].fahr+=s.fahr; md[d.getMonth()].pause+=s.pause
      }
    })
    let tA=0,tF=0,tP=0
    const rows=md.map((m,i)=>{tA+=m.arb;tF+=m.fahr;tP+=m.pause;const tot=m.arb+m.fahr-m.pause;return`<tr><td style="text-align:left">${months[i]}</td><td>${m.arb>0?fH(m.arb):'–'}</td><td class="rbl">${m.fahr>0?fH(m.fahr):'–'}</td><td class="ro">${m.pause>0?fH(m.pause):'–'}</td><td style="font-weight:500">${tot>0?fH(tot):'–'}</td></tr>`}).join('')
    const html=`<div style="overflow-x:auto"><table class="rt">
      <thead>
        <tr><th colspan="5" class="r1" style="text-align:left;padding:5px 7px">${co}</th></tr>
        <tr><th colspan="2" class="r1" style="text-align:left;padding:3px 7px">${g('mit')}: ${em}</th><th colspan="3" class="r1">${g('jb')}: ${year}</th></tr>
        <tr><th class="r2" style="text-align:left">${g('mon')}</th><th class="r2">${g('arb')}</th><th class="r2 rbl">${g('fahr')}</th><th class="r2 ro">${g('pau')}</th><th class="r2">${g('ges')}</th></tr>
      </thead>
      <tbody>
        ${rows}
        <tr><td class="rg" style="text-align:left;font-weight:500">${g('ges')}</td><td class="rg">${fH(tA)}</td><td class="rbl">${fH(tF)}</td><td class="ro">${fH(tP)}</td><td class="rtot">${fH(tA+tF-tP)}</td></tr>
      </tbody>
    </table></div>${daySummary(allKeys)}`
    return{period,html}
  },[rYO,aData,months,co,em,lang])

  const{period,html}=useMemo(()=>{
    if(repType==='wk')return buildWk()
    if(repType==='mc')return buildMC()
    if(repType==='mo')return buildMo()
    return buildYr()
  },[repType,buildWk,buildMC,buildMo,buildYr])

  const nav=dir=>{
    if(repType==='wk')setRWO(v=>v+dir)
    else if(repType==='mc'||repType==='mo')setRMO(v=>v+dir)
    else setRYO(v=>v+dir)
  }

  const doPrint=()=>{
    if (!isPro) {
      toast.error(lang === 'ar' ? 'طباعة التقارير وحفظها بصيغة PDF تتطلب اشتراك PRO.' : lang === 'en' ? 'Printing reports requires a PRO subscription.' : 'Das Drucken von Berichten erfordert ein PRO-Abonnement.')
      return
    }
    let sigHtml = ''
    if (settings.signature) {
      sigHtml = `<div class="sig-box">
        <div style="text-align:center;">
          <img src="${settings.signature}" class="sig-img" />
          <div style="font-size:12px;margin-top:4px;">${lang==='ar'?'توقيع العامل':lang==='en'?"Worker's Signature":'Unterschrift Mitarbeiter'}</div>
        </div>
      </div>`
    }

    const w=window.open('','_blank','width=1050,height=750')
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${co} – ${period}</title><style>${PRINT_CSS}</style></head><body>${html}${sigHtml}</body></html>`)
    w.document.close(); setTimeout(()=>w.print(),700)
  }

  const TABS=[
    {id:'wk',label:lang==='ar'?'تقرير أسبوعي':lang==='en'?'Weekly':'Wochenbericht'},
    {id:'mc',label:lang==='ar'?'الشهر مجمع 👑':lang==='en'?'Month comb. 👑':'Monat komb. 👑'},
    {id:'mo',label:lang==='ar'?'تقرير شهري 👑':lang==='en'?'Monthly 👑':'Monatsbericht 👑'},
    {id:'yr',label:lang==='ar'?'تقرير سنوي 👑':lang==='en'?'Yearly 👑':'Jahresbericht 👑'},
  ]

  const INLINE=`
.rt{border-collapse:collapse;width:100%;font-size:11px;}
.rt th,.rt td{border:1px solid #bbb;padding:4px 6px;text-align:center;white-space:nowrap;}
.r1{background:#F5A623!important;color:#412402!important;font-weight:600;}
.r2{background:#FAD07A!important;color:#633806!important;font-weight:600;}
.rg{background:#C8E6A0!important;color:#27500A!important;}
.rbl{background:#B5D4F4!important;color:#0C447C!important;}
.ro{background:#F5C4B3!important;color:#712B13!important;}
.rtot{background:#4CAF50!important;color:#fff!important;font-weight:700;}
.rsk{background:#FCEBEB!important;color:#A32D2D!important;}
.rho{background:#E6F1FB!important;color:#185FA5!important;}
.rva{background:#EAF3DE!important;color:#3B6D11!important;}
`

  return (
    <div className="glass-light rounded-2xl p-4">
      <style dangerouslySetInnerHTML={{__html:INLINE}}/>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {TABS.map(tb=>(
          <button key={tb.id} onClick={()=>{
            if (tb.id !== 'wk' && !isPro) {
              toast.error(lang === 'ar' ? 'التقارير المتقدمة متوفرة في نسخة PRO فقط!' : lang === 'en' ? 'Advanced reports are only available in PRO version!' : 'Erweiterte Berichte sind nur in der PRO-Version verfügbar!')
              return
            }
            setRepType(tb.id)
          }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border cursor-pointer transition-all
              ${repType===tb.id?'bg-amber-400 border-amber-500 text-amber-900':'bg-white/70 border-purple-200 text-purple-600 hover:bg-white/90'}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* Nav */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <NavCircle onClick={()=>nav(-1)}>‹</NavCircle>
        <NavCircle onClick={()=>nav(1)}>›</NavCircle>
        <div className="flex-1 text-sm font-bold text-purple-900 text-center">{period}</div>
        <button onClick={doPrint}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full border cursor-pointer transition-all ${!isPro ? 'bg-purple-50 border-purple-200 text-purple-500 opacity-80 hover:bg-purple-100' : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'}`}>
          {!isPro ? '🔒' : '🖨'} {lang==='ar'?'طباعة':lang==='en'?'Print':'Drucken'}
        </button>
      </div>

      {/* Content */}
      <div style={{overflowX:'auto'}} dangerouslySetInnerHTML={{__html:html}}/>
    </div>
  )
}
