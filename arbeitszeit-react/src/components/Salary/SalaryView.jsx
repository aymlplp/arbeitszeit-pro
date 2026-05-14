// src/components/Salary/SalaryView.jsx
import { useMemo } from 'react'
import useAppStore from '@/store/useAppStore'
import { calcSalary, minsToHHMM, minsToStd, formatEur } from '@/lib/utils'
import { getWeekDates } from '@/lib/utils'

export default function SalaryView({ t }) {
  const { aData, settings, weekOffset, aYear, updateSettings } = useAppStore()
  const lang   = useAppStore(s => s.lang)
  const rate   = parseFloat(settings.rate)  || 0
  const period = settings.salPeriod || 'month'

  const { arb, fahr, pause, tot } = useMemo(
    () => calcSalary(period, aData, weekOffset, aYear),
    [period, aData, weekOffset, aYear]
  )
  const gross = (tot / 60) * rate  // tot is in minutes, rate is €/h

  const L = {
    title:   {de:'Gehaltsrechner',    en:'Salary Calculator', ar:'حاسبة الراتب'},
    rate:    {de:'Stundensatz',       en:'Hourly Rate',        ar:'سعر الساعة'},
    per:     {de:'Zeitraum',          en:'Period',             ar:'الفترة'},
    wk:      {de:'Diese Woche',       en:'This Week',          ar:'هذا الأسبوع'},
    mo:      {de:'Dieser Monat',      en:'This Month',         ar:'هذا الشهر'},
    yr:      {de:'Dieses Jahr',       en:'This Year',          ar:'هذه السنة'},
    arb:     {de:'Arbeitszeit',       en:'Work Time',          ar:'ساعات العمل'},
    fahr:    {de:'Fahrzeit',          en:'Drive Time',         ar:'القيادة'},
    pau:     {de:'Pause (abzug)',     en:'Break (deduct)',     ar:'الاستراحة (خصم)'},
    net:     {de:'Netto Stunden',     en:'Net Hours',          ar:'الساعات الصافية'},
    rateRow: {de:'Stundensatz',       en:'Rate',               ar:'سعر الساعة'},
    gross:   {de:'Bruttogehalt',      en:'Gross Salary',       ar:'الراتب الإجمالي'},
    print:   {de:'🖨 Gehaltsausdruck',en:'🖨 Print Salary',    ar:'🖨 طباعة كشف الراتب'},
  }
  const g = k => L[k]?.[lang] || L[k]?.de

  const rows = [
    { label: g('arb'),     value: minsToHHMM(arb),   sub: minsToStd(arb),   color: '#C8E6A0', txtColor: '#27500A' },
    { label: g('fahr'),    value: minsToHHMM(fahr),  sub: minsToStd(fahr),  color: '#B5D4F4', txtColor: '#0C447C' },
    { label: `– ${g('pau')}`, value: minsToHHMM(pause), sub: minsToStd(pause), color: '#F5C4B3', txtColor: '#712B13' },
    { label: g('net'),     value: minsToHHMM(tot),   sub: minsToStd(tot),   bold: true },
    { label: `${rate.toFixed(2)} €/h`, value: formatEur(gross), bold: true, accent: true },
  ]

  const printSalary = () => {
    const em  = settings.name || ''
    const co  = settings.co   || ''
    const pLbl= period==='week'?g('wk'):period==='month'?g('mo'):g('yr')
    const w   = window.open('','_blank')
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"><title>Gehalt – ${em}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
        body{font-family:Arial,sans-serif;padding:30px;color:#1e1854;max-width:500px;}
        .hdr{background:#1e1854;color:#fff;padding:14px 18px;border-radius:8px;margin-bottom:20px;}
        .hdr h1{font-size:18px;}.hdr p{font-size:12px;opacity:.7;margin-top:4px;}
        .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #ede9fa;font-size:13px;}
        .row:last-child{border-bottom:none;}.val{font-weight:700;color:#1e1854;}
        .tot{background:#1e1854;color:#fff;padding:14px 18px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-top:16px;}
        .tot span{font-size:12px;opacity:.7;}.tot strong{font-size:24px;}
        @media print{@page{size:A4;margin:15mm;}}
      </style>
    </head><body>
      <div class="hdr"><h1>Gehaltsabrechnung</h1><p>${co} · ${em} · ${pLbl}</p></div>
      ${rows.map(r=>`<div class="row"><span>${r.label}</span><span class="val">${r.value}</span></div>`).join('')}
      <div class="tot"><span>${g('gross')}</span><strong>${formatEur(gross)}</strong></div>
    </body></html>`)
    w.document.close()
    setTimeout(()=>w.print(),500)
  }

  return (
    <div className="glass-light rounded-2xl p-5">
      <div className="text-base font-bold text-purple-900 mb-4">{g('title')}</div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-purple-50 rounded-xl p-3">
          <div className="text-xs text-purple-500 mb-2">{g('rate')}</div>
          <div className="flex items-center gap-2">
            <input type="number" min="0" step="0.5"
              value={rate || ''}
              placeholder="0"
              onChange={e => updateSettings({ rate: parseFloat(e.target.value)||0 })}
              className="w-20 text-lg font-bold bg-white border border-purple-200 rounded-lg px-2 py-1 text-purple-900 outline-none focus:border-purple-500"
            />
            <span className="text-sm text-purple-400 font-medium">€/h</span>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-3">
          <div className="text-xs text-purple-500 mb-2">{g('per')}</div>
          <select value={period} onChange={e=>updateSettings({salPeriod:e.target.value})}
            className="w-full bg-white border border-purple-200 rounded-lg px-2 py-1.5 text-sm text-purple-900 outline-none focus:border-purple-500 mt-0.5">
            <option value="week">{g('wk')}</option>
            <option value="month">{g('mo')}</option>
            <option value="year">{g('yr')}</option>
          </select>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-purple-50/50 rounded-xl p-4 mb-4 space-y-0">
        {rows.map((r,i)=>(
          <div key={i} style={r.color?{background:r.color,color:r.txtColor}:{}}
            className={`flex justify-between py-2.5 px-2 rounded-lg mb-1.5 text-sm last:mb-0
              ${!r.color&&r.bold?'bg-white border border-purple-200 text-purple-900':''}
              ${r.accent?'!bg-purple-600 !text-white':''}`}>
            <span className={r.bold&&!r.color?'font-bold':''}>{r.label}</span>
            <span className={r.bold?'font-bold':'font-semibold'}>{r.value}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="rounded-xl p-4 flex justify-between items-center text-white mb-4"
        style={{background:'#1e1854'}}>
        <span className="text-sm text-white/70">{g('gross')}</span>
        <strong className="text-xl">{formatEur(gross)}</strong>
      </div>

      <button onClick={printSalary}
        className="w-full py-3 rounded-full font-bold text-sm text-white cursor-pointer transition-all hover:opacity-90"
        style={{background:'linear-gradient(90deg,#1e1854,#5b4fcf)'}}>
        {g('print')}
      </button>
    </div>
  )
}
