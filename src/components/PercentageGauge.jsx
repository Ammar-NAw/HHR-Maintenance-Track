export default function PercentageGauge({ percent }) {
  const hasData = percent != null && percent !== '—'
  const value = hasData ? Math.min(100, Math.max(0, Number(percent) || 0)) : 0
  const label = hasData
    ? Number.isInteger(value)
      ? String(value)
      : value.toFixed(1)
    : '—'

  return (
    <div
      className="percentage-gauge"
      style={{
        '--percentage': String(value),
        background: `conic-gradient(#15998f ${hasData ? value : 0}%, #e7edf2 0)`,
      }}
      role="img"
      aria-label={hasData ? `${label} percent` : 'No data loaded'}
    >
      <span className="percentage-gauge__label">{hasData ? `${label}%` : '—'}</span>
    </div>
  )
}
