import * as XLSX from '@e965/xlsx'

console.log('### CURRENT MAINTENANCE PARSER BUILD ACTIVE ###')

export const TQI_THRESHOLD = 0.6

export function readWorkbook(buffer) {
  return XLSX.read(buffer, { type: 'array' })
}

export function worksheetToRows(worksheet) {
  return XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: false,
  })
}

export function normalizeLabel(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s*%\s*/g, '%')
}

function cellsOf(row) {
  if (Array.isArray(row)) return row
  if (row && typeof row === 'object') {
    const keys = Object.keys(row)
      .filter((key) => /^\d+$/.test(key))
      .sort((a, b) => Number(a) - Number(b))
    if (keys.length) return keys.map((key) => row[key])
  }
  return []
}

function findCellIndex(row, label, normalize = normalizeLabel) {
  const expected = normalize(label)
  const cells = cellsOf(row)
  return cells.findIndex((cell) => normalize(cell) === expected)
}

function getTrackClassRow(rows, label) {
  return rows.find((row) => findCellIndex(row, label) >= 0)
}

export function parseNumber(value) {
  if (value == null || value === '') return null
  const cleaned = String(value).replace(/,/g, '').trim()
  const number = Number(cleaned)
  return Number.isFinite(number) ? number : null
}

export function parsePercentage(value) {
  if (value == null || value === '') return null
  const text = String(value).trim()
  if (text.endsWith('%')) {
    const number = parseFloat(text.replace('%', ''))
    return Number.isFinite(number) ? number : null
  }
  const number = Number(text)
  if (!Number.isFinite(number)) return null
  return number >= 0 && number <= 1 ? number * 100 : number
}

export function toNumber(value) {
  return parseNumber(value)
}

export function normalizePercent(value) {
  return parsePercentage(value)
}

function isBlank(value) {
  return value == null || String(value).trim() === ''
}

export function parseKpField(value) {
  if (isBlank(value)) return null
  const compact = String(value).replace(/\s+/g, ' ').trim()
  const nums = compact.match(/\d+(?:\.\d+)?/g)
  if (!nums) return null
  const values = nums.map(Number).filter(Number.isFinite)
  if (!values.length) return null
  const midpoint =
    values.length === 1 ? values[0] : (Math.min(...values) + Math.max(...values)) / 2
  const kpLabel = /^kp\b/i.test(compact) ? compact : `KP ${compact}`
  return { kp: midpoint, kpLabel }
}

function isTrkHeaderCell(value) {
  const key = normalizeLabel(value).replace(/\s+/g, '')
  return key === 'trk1' || key === 'trk2'
}

function looksNumeric(value) {
  return parseNumber(String(value).replace(/%/g, '')) != null && !/[A-Za-z]/.test(String(value))
}

function parseTqi(rows) {
  const trk1Row = getTrackClassRow(rows, 'Track Quality Index trend TRK1')
  const trk2Row = getTrackClassRow(rows, 'Track Quality Index trend TRK2')
  if (!trk1Row || !trk2Row) {
    return { periods: [], trk1: [], trk2: [], threshold: TQI_THRESHOLD }
  }

  const trk1Index = rows.indexOf(trk1Row)
  const trk1Cells = cellsOf(trk1Row)
  const trk2Cells = cellsOf(trk2Row)
  const labelCol = findCellIndex(trk1Row, 'Track Quality Index trend TRK1')
  const periodCols = []
  for (let c = Math.max(0, labelCol) + 1; c < trk1Cells.length; c += 1) {
    const value = trk1Cells[c]
    if (isBlank(value)) continue
    if (looksNumeric(value)) break
    periodCols.push(c)
  }

  const valueRow = cellsOf(rows[trk1Index + 1] || [])
  const periods = periodCols.map((c) => String(trk1Cells[c] ?? '').trim())
  const trk1 = periodCols.map((c) => parseNumber(valueRow[c]))
  const trk2 = periodCols.map((c) => parseNumber(trk2Cells[c]))

  return {
    periods,
    trk1,
    trk2,
    threshold: TQI_THRESHOLD,
  }
}

function normalizeTrackClassLabel(value) {
  return normalizeLabel(value).replace(/\(\s*([a-e])\s*\)/g, '($1)')
}

function getTrackClassCategoryRow(rows, label) {
  const expected = normalizeTrackClassLabel(label)
  return rows.find((row) =>
    cellsOf(row).some((cell) => normalizeTrackClassLabel(cell) === expected),
  )
}

function parseTrackClassGroup(rows, kind) {
  const aLabel = `Track Class ${kind} category (A)`
  const aHeader = getTrackClassCategoryRow(rows, aLabel)
  const bRow = cellsOf(getTrackClassCategoryRow(rows, `Track Class ${kind} category (B)`))
  const cRow = cellsOf(getTrackClassCategoryRow(rows, `Track Class ${kind} category (C)`))
  const dRow = cellsOf(getTrackClassCategoryRow(rows, `Track Class ${kind} category (D)`))
  const eRow = cellsOf(getTrackClassCategoryRow(rows, `Track Class ${kind} category (E)`))

  const headerCells = cellsOf(aHeader)
  const labelCol = headerCells.findIndex((cell) => normalizeTrackClassLabel(cell) === normalizeTrackClassLabel(aLabel))
  const start = labelCol >= 0 ? labelCol + 1 : 1

  let aRow = headerCells
  if (aHeader && (isTrkHeaderCell(headerCells[start]) || isTrkHeaderCell(headerCells[start + 1]))) {
    const headerIndex = rows.indexOf(aHeader)
    aRow = cellsOf(rows[headerIndex + 1])
  }

  return {
    line1: {
      A: parsePercentage(aRow?.[start]),
      B: parsePercentage(bRow?.[start]),
      C: parsePercentage(cRow?.[start]),
      D: parsePercentage(dRow?.[start]),
      E: parsePercentage(eRow?.[start]),
    },
    line2: {
      A: parsePercentage(aRow?.[start + 1]),
      B: parsePercentage(bRow?.[start + 1]),
      C: parsePercentage(cRow?.[start + 1]),
      D: parsePercentage(dRow?.[start + 1]),
      E: parsePercentage(eRow?.[start + 1]),
    },
  }
}

function isRailQualityLabel(value) {
  const key = normalizeLabel(value)
  if (!key) return false
  return (
    key === 'llp' ||
    key.startsWith('llp (') ||
    key.startsWith('llp %') ||
    key.startsWith('yearly broken rail') ||
    key === 'broken rail'
  )
}

function parseTsrTable(rows) {
  let headerRow = -1
  const cols = { section: 0, kp: 1, track: 2, reason: 3, restriction: 4 }
  for (let r = 0; r < rows.length; r += 1) {
    const row = cellsOf(rows[r])
    const normalized = row.map((cell) => normalizeLabel(cell))
    if (
      normalized.includes('section') &&
      normalized.includes('kp') &&
      normalized.includes('track') &&
      normalized.includes('reason') &&
      normalized.includes('restriction')
    ) {
      headerRow = r
      row.forEach((cell, c) => {
        const key = normalizeLabel(cell)
        if (key === 'section') cols.section = c
        if (key === 'kp') cols.kp = c
        if (key === 'track') cols.track = c
        if (key === 'reason') cols.reason = c
        if (key === 'restriction') cols.restriction = c
      })
      break
    }
  }

  if (headerRow < 0) return { foundHeader: false, records: [] }

  const records = []
  for (let r = headerRow + 1; r < rows.length; r += 1) {
    const row = rows[r] || []
    const section = row[cols.section]
    const kp = row[cols.kp]
    const track = row[cols.track]
    const reason = row[cols.reason]
    const restriction = row[cols.restriction]
    if ([section, kp, track, reason, restriction].every(isBlank)) break
    if (isRailQualityLabel(section) || isRailQualityLabel(row[0]) || isRailQualityLabel(kp)) break
    if (isBlank(section) && isBlank(kp)) continue
    const parsedKp = parseKpField(kp)
    if (!parsedKp) continue
    records.push({
      id: `tsr-${records.length + 1}`,
      location: String(section).trim() || '—',
      kp: parsedKp.kp,
      kpLabel: parsedKp.kpLabel,
      track: String(track ?? '').trim(),
      reason: String(reason ?? '').trim(),
      restriction: String(restriction ?? '').trim(),
      status: 'Active',
    })
  }

  return { foundHeader: true, records }
}

function classTotal(values) {
  return ['A', 'B', 'C', 'D', 'E'].reduce((sum, letter) => sum + (Number(values[letter]) || 0), 0)
}

export function parseDashboardData(rows) {
  rows.slice(29, 35).forEach((row, index) => {
    console.error(`KPI ROW ${index + 29}:`, JSON.stringify(row))
  })
  rows.slice(16, 29).forEach((row, index) => {
    console.error(`TRACK CLASS ROW ${index + 16}:`, JSON.stringify(row))
  })
  const normalizeLabel = (value) =>
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[–—]/g, '-')
      .replace(/\s+/g, ' ')

  function findValue(label) {
    const target = normalizeLabel(label)
    const row = rows.find((row) => normalizeLabel(row?.[0]) === target)
    return row?.[1] ?? null
  }

  function findFirstValue(...labels) {
    for (const label of labels) {
      const value = findValue(label)
      if (value != null && String(value).trim() !== '') return value
    }
    return null
  }

  function findValueMatching(predicate) {
    const row = rows.find((row) => predicate(normalizeLabel(row?.[0])))
    return row?.[1] ?? null
  }

  function parseNum(value) {
    if (value == null || value === '') return null
    const n = Number(String(value).replace(/,/g, '').trim())
    return Number.isFinite(n) ? n : null
  }

  function parsePercent(value) {
    if (value == null || value === '') return null
    const text = String(value).trim()
    if (text.endsWith('%')) {
      const n = parseFloat(text)
      return Number.isFinite(n) ? n : null
    }
    const n = Number(text)
    if (!Number.isFinite(n)) return null
    return n <= 1 ? n * 100 : n
  }

  const data = {
    reportingPeriod: findValue('Reporting Period'),
    routeAvailability: parsePercent(findValue('Route Avilability - TSR%')),
    incidents: {
      safety: parseNum(findValue('Safety Incident')),
      operationalDelay: parseNum(findValue('Incident affected +5min operation')),
      total: parseNum(findValue('Incidents')),
    },
    maintenance: {
      corrective: parseNum(findValue('Corrective mainteance')),
      preventive: parseNum(findValue('Previntve mainteannce')),
      predictive: parseNum(findValue('Predictive mainteance')),
      total: parseNum(findValue('Maintenace Activities')),
    },
    mtbf: {
      fence: parseNum(findValue('MTBF Fence (hr)')),
      track: parseNum(findValue('MTBF Track (hr)')),
      turnout: parseNum(findValue('MTBF Turnout (hr)')),
    },
    maintenanceCompliance: parsePercent(findValue('Mainteance Complince')),
    yearlyBrokenRail: parseNum(
      findFirstValue(
        'Yearly Broken rail',
        'Yearly Broken Rail',
        'Yearly broken rail',
      ) ?? findValueMatching((key) => key.startsWith('yearly broken rail')),
    ),
    llp: parsePercent(
      findFirstValue(
        'LLP ( Percentage of track sections that over 2LL0 )',
        'LLP (Percentage of track sections that over 2LL0 )',
        'LLP ( Percentage of track sections that over 2LL0)',
        'LLP',
      ) ?? findValueMatching((key) => key === 'llp' || key.startsWith('llp (') || key.startsWith('llp %')),
    ),
    kpi: {
      im1: parseNum(findValue('KPI-IM1')),
      isr: parseNum(findValue('KPI-ISR')),
      grindingProgress: parsePercent(findValue('Grinding progress')),
      sparePartAvailability: parsePercent(findValue('Spare part avilability %')),
      machineAvailability: parsePercent(findValue('Machince avilability %')),
    },
  }

  console.error('FINAL BASIC METRICS:', {
    routeAvailability: data.routeAvailability,
    corrective: data.maintenance.corrective,
    preventive: data.maintenance.preventive,
    predictive: data.maintenance.predictive,
    total: data.maintenance.total,
    maintenanceCompliance: data.maintenanceCompliance,
    yearlyBrokenRail: data.yearlyBrokenRail,
    llp: data.llp,
  })

  const tsr = parseTsrTable(rows)
  data.tqi = parseTqi(rows)
  data.trackClass = {
    LL: parseTrackClassGroup(rows, 'LL'),
    AL: parseTrackClassGroup(rows, 'AL'),
  }
  data.tsr = tsr.records
  data.tsrFound = tsr.foundHeader
  data.warnings = []
  return data
}

function isMissing(value) {
  return value === null || value === undefined || value === ''
}

function receivedText(value) {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (value === '') return '""'
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function check(errors, path, value) {
  if (value === null || value === undefined || value === '') {
    errors.push(`Validation failed: ${path} received ${receivedText(value)}`)
    return false
  }
  return true
}

export function validateDashboardData(dashboardData) {
  const errors = []
  const data = dashboardData || {}

  check(errors, 'reportingPeriod', data.reportingPeriod)
  check(errors, 'routeAvailability', data.routeAvailability)
  check(errors, 'incidents.safety', data.incidents?.safety)
  check(errors, 'incidents.operationalDelay', data.incidents?.operationalDelay)
  check(errors, 'incidents.total', data.incidents?.total)
  check(errors, 'maintenance.corrective', data.maintenance?.corrective)
  check(errors, 'maintenance.preventive', data.maintenance?.preventive)
  check(errors, 'maintenance.predictive', data.maintenance?.predictive)
  check(errors, 'maintenance.total', data.maintenance?.total)
  check(errors, 'mtbf.fence', data.mtbf?.fence)
  check(errors, 'mtbf.track', data.mtbf?.track)
  check(errors, 'mtbf.turnout', data.mtbf?.turnout)
  check(errors, 'maintenanceCompliance', data.maintenanceCompliance)
  check(errors, 'kpi.im1', data.kpi?.im1)
  check(errors, 'kpi.isr', data.kpi?.isr)
  check(errors, 'kpi.grindingProgress', data.kpi?.grindingProgress)
  check(errors, 'kpi.sparePartAvailability', data.kpi?.sparePartAvailability)
  check(errors, 'kpi.machineAvailability', data.kpi?.machineAvailability)

  const periods = data.tqi?.periods
  const trk1 = data.tqi?.trk1
  const trk2 = data.tqi?.trk2
  if (!Array.isArray(periods) || periods.length === 0) {
    errors.push(`Validation failed: tqi.periods received ${receivedText(periods)}`)
  } else {
    periods.forEach((period, index) => check(errors, `tqi.periods[${index}]`, period))
    if (!Array.isArray(trk1)) {
      errors.push(`Validation failed: tqi.trk1 received ${receivedText(trk1)}`)
    } else {
      periods.forEach((_, index) => check(errors, `tqi.trk1[${index}]`, trk1[index]))
    }
    if (!Array.isArray(trk2)) {
      errors.push(`Validation failed: tqi.trk2 received ${receivedText(trk2)}`)
    } else {
      periods.forEach((_, index) => check(errors, `tqi.trk2[${index}]`, trk2[index]))
    }
  }
  check(errors, 'tqi.threshold', data.tqi?.threshold)

  ;['LL', 'AL'].forEach((group) => {
    ;['line1', 'line2'].forEach((line) => {
      const values = data.trackClass?.[group]?.[line]
      if (values == null) {
        errors.push(`Validation failed: trackClass.${group}.${line} received ${receivedText(values)}`)
        return
      }
      ;['A', 'B', 'C', 'D', 'E'].forEach((letter) => {
        check(errors, `trackClass.${group}.${line}.${letter}`, values[letter])
      })
      const total = classTotal(values)
      if (['A', 'B', 'C', 'D', 'E'].every((letter) => !isMissing(values[letter]))) {
        if (Math.abs(total - 100) > 1) {
          errors.push(
            `Validation failed: trackClass.${group}.${line} A-E total received ${receivedText(total)}`,
          )
        }
      }
    })
  })

  if (data.tsr == null) {
    errors.push(`Validation failed: tsr received ${receivedText(data.tsr)}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

