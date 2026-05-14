// src/components/Archive/ArchiveView.jsx
import { useState, useRef } from 'react'
import useAppStore from '@/store/useAppStore'
import { Button, Divider, SectionHeader } from '@/components/UI'
import toast from 'react-hot-toast'

export default function ArchiveView({ t, onBack }) {
  const { aData, aYear, setAData, setAYear, archivedYears, setArchivedYears, areas, acts, settings, lang } = useAppStore()
  const [selYear, setSelYear] = useState(new Date().getFullYear())
  const fileRef = useRef()

  const doArchive = () => {
    const key = `zt_arch_${selYear}`
    localStorage.setItem(key, JSON.stringify(aData))
    if (!archivedYears.includes(selYear)) {
      setArchivedYears([...archivedYears, selYear])
    }
    toast.success(`${selYear} archiviert!`)
  }

  const loadArch = (yr) => {
    const raw = localStorage.getItem(`zt_arch_${yr}`)
    if (!raw) { toast.error(`Keine Daten für ${yr}`); return }
    setAData(JSON.parse(raw))
    setAYear(yr)
    toast.success(`Jahr ${yr} geladen!`)
    onBack()
  }

  const doExport = () => {
    const obj = { v: 2, aData, aYear, archivedYears, areas, acts, settings, lang }
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `arbeitszeit_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const doImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const o = JSON.parse(ev.target.result)
        if (o.aData) setAData(o.aData)
        if (o.aYear) setAYear(o.aYear)
        if (o.archivedYears) setArchivedYears(o.archivedYears)
        toast.success('Import erfolgreich!')
        onBack()
      } catch (err) {
        toast.error('Fehler: ' + err.message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const curYear = new Date().getFullYear()
  const yearOpts = [curYear - 1, curYear, curYear + 1]

  return (
    <div className="glass-light rounded-2xl p-5 space-y-5">
      <div className="text-sm font-bold text-purple-900">{t.archive}</div>

      {/* Archive year */}
      <div>
        <SectionHeader>💾 {t.archiveYear}</SectionHeader>
        <div className="flex items-center gap-3">
          <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}
            className="bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm text-purple-900 outline-none focus:border-purple-500">
            {yearOpts.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button variant="primary" onClick={doArchive}>{t.archiveBtnLbl}</Button>
        </div>
      </div>

      <Divider />

      {/* Archived years */}
      <div>
        <SectionHeader>📅 {t.archivedYears}</SectionHeader>
        {archivedYears.length === 0 ? (
          <div className="text-center text-sm text-purple-400/60 py-4 bg-purple-50 rounded-xl italic">
            {t.noArchive}
          </div>
        ) : (
          <div className="space-y-2">
            {[...archivedYears].sort((a, b) => b - a).map(yr => (
              <div key={yr} className="flex items-center justify-between px-4 py-2.5 bg-purple-50 rounded-xl">
                <span className="text-sm font-semibold text-purple-900">{yr}</span>
                <Button variant="smGhost" onClick={() => loadArch(yr)}>{t.load}</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* Backup */}
      <div>
        <SectionHeader>⬇ {t.fullBackup}</SectionHeader>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={doExport}>{t.downloadJSON}</Button>
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>{t.restoreJSON}</Button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={doImport} />
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button variant="ghost" onClick={onBack}>{t.close}</Button>
      </div>
    </div>
  )
}
