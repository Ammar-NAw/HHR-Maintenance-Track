import { ArrowDown, ArrowUp } from 'lucide-react'

function ChangeArrow({ change }) {
  if (!change || change.direction === 'flat' || change.amount === 0) return null
  const Icon = change.direction === 'up' ? ArrowUp : ArrowDown
  return (
    <span
      className={`kpi-card__change kpi-card__change--${change.tone || 'flat'}`}
      title="Change vs previous month"
    >
      <Icon size={11} strokeWidth={2.8} />
      {change.label}
    </span>
  )
}

export default function KpiCard({
  title,
  value,
  unit,
  hint,
  change,
  icon: Icon,
  tone = 'default',
}) {
  return (
    <article className={`kpi-card kpi-card--${tone}`}>
      <div className="kpi-card__top">
        {Icon ? (
          <span className="kpi-card__icon" aria-hidden="true">
            <Icon size={14} strokeWidth={2.1} />
          </span>
        ) : null}
        <h3 className="kpi-card__title">{title}</h3>
      </div>
      <p className="kpi-card__value">
        {value}
        {unit && value !== '—' ? <span className="kpi-card__unit">{unit}</span> : null}
        <ChangeArrow change={change} />
      </p>
      {hint ? <p className="kpi-card__hint">{hint}</p> : null}
    </article>
  )
}
