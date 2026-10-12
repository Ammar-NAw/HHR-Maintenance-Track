import Panel from './Panel'

const EMPTY = '—'

function Metric({ title, value, unit, hint, tone = 'default' }) {
  return (
    <div className={`rail-metric rail-metric--${tone}`}>
      <p className="rail-metric__title">{title}</p>
      <p className="rail-metric__value">
        {value}
        {unit && value !== EMPTY ? <span className="rail-metric__unit">{unit}</span> : null}
      </p>
      {hint ? <p className="rail-metric__hint">{hint}</p> : null}
    </div>
  )
}

function formatMetric(value, digits) {
  if (value == null) return EMPTY
  const n = Number(value)
  if (!Number.isFinite(n)) return EMPTY
  const rounded = Number(n.toFixed(digits))
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(digits)
}

export default function RailQualityPanel({ yearlyBrokenRail, llp }) {
  const brokenValue = formatMetric(yearlyBrokenRail, 0)
  const llpValue = formatMetric(llp, 1)
  const brokenTone =
    yearlyBrokenRail == null ? 'default' : yearlyBrokenRail < 6 ? 'positive' : 'warning'
  const llpTone = llp == null ? 'default' : llp < 25 ? 'positive' : 'warning'

  return (
    <Panel
      title="Rail Quality"
      subtitle="Yearly broken rail and LLP limits"
      className="panel--rail-quality"
    >
      <div className="rail-quality">
        <Metric
          title="LLP"
          value={llpValue}
          unit={llp == null ? null : '%'}
          hint="Over 2LL0 · Target < 25%"
          tone={llpTone}
        />
        <Metric
          title="Yearly Broken Rail"
          value={brokenValue}
          hint="Target < 6"
          tone={brokenTone}
        />
      </div>
    </Panel>
  )
}
