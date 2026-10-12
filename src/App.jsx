import { useLayoutEffect, useRef, useState } from 'react'
import { AlertTriangle, ClipboardCheck, Gauge, ListChecks, ShieldAlert, Sparkles, Timer, Wrench } from 'lucide-react'
import DashboardHeader from './components/DashboardHeader'
import KpiCard from './components/KpiCard'
import BottomKpiPanel from './components/BottomKpiPanel'
import MtbfPanel from './components/MtbfPanel'
import TqiChart from './components/TqiChart'
import TrackClassDistribution from './components/TrackClassDistribution'
import RouteOverview from './components/RouteOverview'
import RailQualityPanel from './components/RailQualityPanel'
import { routeMaxKp, stations } from './data/route'
import {
  parseDashboardData,
  readWorkbook,
  validateDashboardData,
  worksheetToRows,
} from './utils/excelParser'
import {
  emptyDashboardView,
  emptyPeriodOptions,
  periodSortValue,
  previousPeriodName,
  viewFromParsed,
} from './utils/dashboardModel'
import './App.css'

const TOP_KPI_ICONS = {
  'route-availability': Gauge,
  'safety-incidents': ShieldAlert,
  'operation-incidents': Timer,
  incident: AlertTriangle,
  corrective: Wrench,
  preventive: ClipboardCheck,
  predictive: Sparkles,
  activities: ListChecks,
}

const EMPTY_FOOTER = 'Upload Excel to populate'
const BASE_WIDTH = 1680
const BASE_HEIGHT = 945

function useDashboardScale() {
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    function updateScale() {
      setScale(Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / BASE_HEIGHT))
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  return scale
}

function App() {
  const scale = useDashboardScale()
  const fileInputRef = useRef(null)
  const [view, setView] = useState(() => emptyDashboardView())
  const [importedMonths, setImportedMonths] = useState(null)
  const [reportingPeriod, setReportingPeriod] = useState(view.reportingPeriod)
  const [periodOptions, setPeriodOptions] = useState(emptyPeriodOptions)
  const [footerMessage, setFooterMessage] = useState(EMPTY_FOOTER)
  const [toast, setToast] = useState(null)
  const [importError, setImportError] = useState(null)
  const toastTimer = useRef(null)

  function showToast(type, message) {
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    setToast({ type, message })
    toastTimer.current = window.setTimeout(() => setToast(null), type === 'error' ? 8000 : 3500)
  }

  function resetToEmpty() {
    const empty = emptyDashboardView()
    setImportedMonths(null)
    setView(empty)
    setReportingPeriod(empty.reportingPeriod)
    setPeriodOptions(emptyPeriodOptions)
  }

  function findPreviousMonth(month, months) {
    if (!months?.length) return null
    const previousName = previousPeriodName(month.parsed?.reportingPeriod || month.periodLabel)
    const byName = months.find((item) =>
      item !== month && (
        item.sheetName === previousName ||
        item.periodLabel === previousName ||
        item.parsed?.reportingPeriod === previousName
      ),
    )
    if (byName) return byName
    const index = months.findIndex((item) =>
      item.sheetName === month.sheetName && item.periodLabel === month.periodLabel,
    )
    return index > 0 ? months[index - 1] : null
  }

  function applyMonth(month, months = importedMonths) {
    const previous = findPreviousMonth(month, months)
    const view = month.parsed ? viewFromParsed(month.parsed, previous?.parsed ?? null) : month.view
    setView(view)
    setReportingPeriod(month.periodLabel || view.reportingPeriod)
    const warningText = view.warnings[0]
    setFooterMessage(warningText ? `Excel loaded · ${warningText}` : 'Excel loaded successfully')
  }

  function handlePeriodChange(period) {
    if (!importedMonths) return
    const month = importedMonths.find((item) => item.periodLabel === period || item.view.reportingPeriod === period)
    if (month) applyMonth(month, importedMonths)
  }

  function uniquePeriodLabel(reportingPeriod, sheetName, used) {
    const base = String(reportingPeriod || sheetName).trim() || sheetName
    if (!used.has(base)) {
      used.add(base)
      return base
    }
    const fallback = `${base} (${sheetName})`
    used.add(fallback)
    return fallback
  }

  async function handleExcelFile(file) {
    if (!file) return
    try {
      setImportError(null)
      const buffer = await file.arrayBuffer()
      const workbook = readWorkbook(buffer)
      console.log('Workbook sheets:', workbook.SheetNames)

      const usedLabels = new Set()
      const months = []
      const skipped = []

      workbook.SheetNames.forEach((sheetName) => {
        try {
          const parsed = parseDashboardData(worksheetToRows(workbook.Sheets[sheetName]))
          const validation = validateDashboardData(parsed)
          if (!validation.valid) {
            skipped.push(`${sheetName}: ${validation.errors[0]}`)
            return
          }
          months.push({
            sheetName,
            parsed,
            periodLabel: uniquePeriodLabel(parsed.reportingPeriod, sheetName, usedLabels),
            view: viewFromParsed(parsed),
          })
        } catch (error) {
          skipped.push(`${sheetName}: ${error?.message || String(error)}`)
        }
      })

      if (!months.length) {
        throw new Error(skipped.join(' | ') || 'No valid monthly sheets were found.')
      }

      months.sort((a, b) => (
        periodSortValue(a.parsed.reportingPeriod || a.sheetName) -
        periodSortValue(b.parsed.reportingPeriod || b.sheetName)
      ))

      const latest = months[months.length - 1]
      setImportedMonths(months)
      setPeriodOptions(months.map((month) => month.periodLabel))
      applyMonth(latest, months)
      setImportError(null)
      const loadedNames = months.map((month) => month.periodLabel).join(', ')
      setFooterMessage(`${months.length} month${months.length === 1 ? '' : 's'} imported: ${loadedNames}`)
      showToast('success', `${months.length} month${months.length === 1 ? '' : 's'} imported`)
    } catch (error) {
      console.error('EXCEL IMPORT FAILED')
      console.error(error)
      console.error('MESSAGE:', error?.message)
      console.error('STACK:', error?.stack)
      const actual = error?.message || String(error)
      const message = `Import failed: ${actual}`
      resetToEmpty()
      setImportError(message)
      setFooterMessage(message)
      showToast('error', message)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="dashboard-stage">
      <div
        className="dashboard-scale"
        style={{ width: BASE_WIDTH * scale, height: BASE_HEIGHT * scale }}
      >
        <div
          className="dashboard-shell"
          style={{
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
      <div className="dashboard">
        <DashboardHeader
          reportingPeriod={reportingPeriod}
          periodOptions={periodOptions}
          onPeriodChange={handlePeriodChange}
          fileInputRef={fileInputRef}
          onExcelFile={handleExcelFile}
          showExcelUpload={!importedMonths}
        />

        <section className="kpi-grid" aria-label="Top performance indicators">
          {view.topKpis.map((kpi) => (
            <KpiCard key={kpi.id} {...kpi} icon={TOP_KPI_ICONS[kpi.id]} />
          ))}
        </section>

        <section className="route-row">
          <RouteOverview stations={stations} tsrs={view.tsrs} maxKp={routeMaxKp} />
          <RailQualityPanel
            yearlyBrokenRail={view.railQuality?.yearlyBrokenRail}
            llp={view.railQuality?.llp}
          />
          <TrackClassDistribution data={view.trackClassDistribution} />
        </section>

        <section className="bottom-grid">
          <MtbfPanel data={view.mtbf} />
          <TqiChart data={view.tqiSeries} />
          <BottomKpiPanel items={view.bottomKpis} />
        </section>

        <footer className="dashboard-footer">
          <span>{reportingPeriod}</span>
          <span>{footerMessage}</span>
        </footer>
      </div>

      {importError ? (
        <div className="import-error-banner" role="alert">
          {importError}
        </div>
      ) : null}

      {toast ? (
        <div className={`import-toast import-toast--${toast.type}`} role="status">
          {toast.message}
        </div>
      ) : null}
        </div>
      </div>
    </div>
  )
}

export default App
