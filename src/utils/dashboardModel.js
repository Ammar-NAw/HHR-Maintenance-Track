const EMPTY = '—'

const EMPTY_CLASS_VALUES = { A: null, B: null, C: null, D: null, E: null }

function formatDisplayNumber(value, digits = 0) {
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value ?? '')
  if (digits === 0 && Number.isInteger(n)) return String(n)
  const rounded = Number(n.toFixed(digits))
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(digits)
}

function roundClass(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, Number(Number(value).toFixed(1))]),
  )
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function parseMonthYear(period) {
  const match = String(period ?? '').trim().match(/^([A-Za-z]+)\s+(\d{4})$/)
  if (!match) return null
  const index = MONTH_NAMES.findIndex((name) => name.toLowerCase() === match[1].toLowerCase())
  if (index < 0) return null
  return { monthIndex: index, year: Number(match[2]) }
}

export function previousPeriodName(period) {
  const parsed = parseMonthYear(period)
  if (!parsed) return null
  if (parsed.monthIndex === 0) return `December ${parsed.year - 1}`
  return `${MONTH_NAMES[parsed.monthIndex - 1]} ${parsed.year}`
}

export function periodSortValue(period) {
  const parsed = parseMonthYear(period)
  if (!parsed) return Number.MAX_SAFE_INTEGER
  return parsed.year * 12 + parsed.monthIndex
}

function metricByKpiId(data, id) {
  if (!data) return null
  switch (id) {
    case 'route-availability':
      return data.routeAvailability
    case 'safety-incidents':
      return data.incidents?.safety
    case 'operation-incidents':
      return data.incidents?.operationalDelay
    case 'incident':
      return data.incidents?.total
    case 'corrective':
      return data.maintenance?.corrective
    case 'preventive':
      return data.maintenance?.preventive
    case 'predictive':
      return data.maintenance?.predictive
    case 'activities':
      return data.maintenance?.total
    default:
      return null
  }
}

function kpiPolarity(id) {
  if (id === 'safety-incidents' || id === 'operation-incidents' || id === 'incident') return 'lower'
  return 'higher'
}

function monthChange(current, previous, polarity = 'higher') {
  if (current == null || previous == null) return null
  const a = Number(current)
  const b = Number(previous)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  const amount = a - b
  if (amount === 0) return null
  const digits = Number.isInteger(amount) ? 0 : 1
  const formatted = formatDisplayNumber(Math.abs(amount), digits)
  const direction = amount > 0 ? 'up' : 'down'
  const improved = polarity === 'lower' ? amount < 0 : amount > 0
  return {
    amount,
    label: amount > 0 ? `+${formatted}` : `-${formatted}`,
    direction,
    tone: improved ? 'good' : 'bad',
  }
}

function withMonthChange(kpi, data, previousData) {
  return {
    ...kpi,
    change: monthChange(
      metricByKpiId(data, kpi.id),
      metricByKpiId(previousData, kpi.id),
      kpiPolarity(kpi.id),
    ),
  }
}

export function viewFromParsed(data, previousData = null) {
  const safety = data.incidents.safety
  const operational = data.incidents.operationalDelay
  const totalIncidents = data.incidents.total

  const topKpis = [
      {
        id: 'route-availability',
        title: 'Route Availability - TSR %',
        value: formatDisplayNumber(data.routeAvailability, 1),
        unit: '%',
        hint: 'Target ≥ 98.0%',
        tone: data.routeAvailability >= 98 ? 'positive' : 'warning',
      },
      {
        id: 'safety-incidents',
        title: 'Safety Incidents',
        value: formatDisplayNumber(safety),
        hint: safety === 0 ? 'No reportable events' : 'Reported this period',
        tone: safety === 0 ? 'positive' : 'warning',
      },
      {
        id: 'operation-incidents',
        title: 'Incidents (+5 min operation)',
        value: formatDisplayNumber(operational),
        hint: 'Reported this period',
        tone: operational === 0 ? 'positive' : 'warning',
      },
      {
        id: 'incident',
        title: 'Incident',
        value: formatDisplayNumber(totalIncidents),
        hint: 'Reported this period',
        tone: totalIncidents === 0 ? 'positive' : 'warning',
      },
      {
        id: 'corrective',
        title: 'Corrective Maintenance',
        value: formatDisplayNumber(data.maintenance.corrective),
        hint: 'Work this period',
        tone: 'default',
      },
      {
        id: 'preventive',
        title: 'Preventive Maintenance',
        value: formatDisplayNumber(data.maintenance.preventive),
        hint: 'Work this period',
        tone: 'default',
      },
      {
        id: 'predictive',
        title: 'Predictive Maintenance',
        value: formatDisplayNumber(data.maintenance.predictive),
        hint: 'Work this period',
        tone: 'default',
      },
      {
        id: 'activities',
        title: 'Maintenance Activities',
        value: formatDisplayNumber(data.maintenance.total),
        hint: 'Total this period',
        tone: 'default',
      },
    ].map((kpi) => withMonthChange(kpi, data, previousData))

  return {
    reportingPeriod: data.reportingPeriod,
    topKpis,
    maintenanceActivities: [
      {
        id: 'preventive',
        name: 'Preventive Maintenance',
        value: data.maintenance.preventive,
        color: '#0d9488',
      },
      {
        id: 'corrective',
        name: 'Corrective Maintenance',
        value: data.maintenance.corrective,
        color: '#1e3a5f',
      },
      {
        id: 'predictive',
        name: 'Predictive Maintenance',
        value: data.maintenance.predictive,
        color: '#14b8a6',
      },
    ],
    mtbf: [
      { asset: 'Fence', hours: data.mtbf.fence },
      { asset: 'Track', hours: data.mtbf.track },
      { asset: 'Turnout', hours: data.mtbf.turnout },
    ],
    tqiSeries: data.tqi.periods.map((period, index) => ({
      month: period,
      TRK1: data.tqi.trk1[index],
      TRK2: data.tqi.trk2[index],
    })),
    trackClassDistribution: [
      {
        type: 'LL Track',
        lines: [
          { name: 'Line 1', values: roundClass(data.trackClass.LL.line1) },
          { name: 'Line 2', values: roundClass(data.trackClass.LL.line2) },
        ],
      },
      {
        type: 'AL Track',
        lines: [
          { name: 'Line 1', values: roundClass(data.trackClass.AL.line1) },
          { name: 'Line 2', values: roundClass(data.trackClass.AL.line2) },
        ],
      },
    ],
    tsrs: data.tsr.map((tsr) => ({ ...tsr, status: 'Active' })),
    railQuality: {
      yearlyBrokenRail: data.yearlyBrokenRail ?? null,
      llp: data.llp ?? null,
    },
    bottomKpis: [
      {
        id: 'kpi-im1',
        title: 'KPI-IM1',
        value: formatDisplayNumber(data.kpi.im1, 0),
        kind: 'index',
        tone: 'default',
      },
      {
        id: 'kpi-isr',
        title: 'KPI-ISR',
        value: formatDisplayNumber(data.kpi.isr, 0),
        kind: 'index',
        tone: 'default',
      },
      {
        id: 'compliance',
        title: 'Maintenance Compliance',
        value: formatDisplayNumber(data.maintenanceCompliance, 1),
        unit: '%',
        kind: 'index',
        tone: 'positive',
      },
      {
        id: 'grinding',
        title: 'Grinding Progress',
        value: data.kpi.grindingProgress,
        kind: 'gauge',
        tone: 'default',
      },
      {
        id: 'spares',
        title: 'Spare Part Availability',
        value: data.kpi.sparePartAvailability,
        kind: 'gauge',
        tone: 'default',
      },
      {
        id: 'machines',
        title: 'Machine Availability',
        value: data.kpi.machineAvailability,
        kind: 'gauge',
        tone: data.kpi.machineAvailability < 90 ? 'warning' : 'default',
      },
    ],
    warnings: data.warnings || [],
  }
}

export function emptyDashboardView() {
  return {
    reportingPeriod: EMPTY,
    topKpis: [
      {
        id: 'route-availability',
        title: 'Route Availability - TSR %',
        value: EMPTY,
        unit: null,
        hint: null,
        tone: 'default',
      },
      {
        id: 'safety-incidents',
        title: 'Safety Incidents',
        value: EMPTY,
        hint: null,
        tone: 'default',
      },
      {
        id: 'operation-incidents',
        title: 'Incidents (+5 min operation)',
        value: EMPTY,
        hint: null,
        tone: 'default',
      },
      {
        id: 'incident',
        title: 'Incident',
        value: EMPTY,
        hint: null,
        tone: 'default',
      },
      {
        id: 'corrective',
        title: 'Corrective Maintenance',
        value: EMPTY,
        hint: null,
        tone: 'default',
      },
      {
        id: 'preventive',
        title: 'Preventive Maintenance',
        value: EMPTY,
        hint: null,
        tone: 'default',
      },
      {
        id: 'predictive',
        title: 'Predictive Maintenance',
        value: EMPTY,
        hint: null,
        tone: 'default',
      },
      {
        id: 'activities',
        title: 'Maintenance Activities',
        value: EMPTY,
        hint: null,
        tone: 'default',
      },
    ],
    maintenanceActivities: [
      { id: 'preventive', name: 'Preventive Maintenance', value: null, color: '#0d9488' },
      { id: 'corrective', name: 'Corrective Maintenance', value: null, color: '#1e3a5f' },
      { id: 'predictive', name: 'Predictive Maintenance', value: null, color: '#14b8a6' },
    ],
    mtbf: [
      { asset: 'Fence', hours: null },
      { asset: 'Track', hours: null },
      { asset: 'Turnout', hours: null },
    ],
    tqiSeries: [],
    trackClassDistribution: [
      {
        type: 'LL Track',
        lines: [
          { name: 'Line 1', values: { ...EMPTY_CLASS_VALUES } },
          { name: 'Line 2', values: { ...EMPTY_CLASS_VALUES } },
        ],
      },
      {
        type: 'AL Track',
        lines: [
          { name: 'Line 1', values: { ...EMPTY_CLASS_VALUES } },
          { name: 'Line 2', values: { ...EMPTY_CLASS_VALUES } },
        ],
      },
    ],
    tsrs: [],
    railQuality: {
      yearlyBrokenRail: null,
      llp: null,
    },
    bottomKpis: [
      { id: 'kpi-im1', title: 'KPI-IM1', value: EMPTY, kind: 'index', tone: 'default' },
      { id: 'kpi-isr', title: 'KPI-ISR', value: EMPTY, kind: 'index', tone: 'default' },
      {
        id: 'compliance',
        title: 'Maintenance Compliance',
        value: EMPTY,
        unit: null,
        kind: 'index',
        tone: 'default',
      },
      { id: 'grinding', title: 'Grinding Progress', value: null, kind: 'gauge', tone: 'default' },
      { id: 'spares', title: 'Spare Part Availability', value: null, kind: 'gauge', tone: 'default' },
      { id: 'machines', title: 'Machine Availability', value: null, kind: 'gauge', tone: 'default' },
    ],
    warnings: [],
  }
}

export const emptyPeriodOptions = [EMPTY]
