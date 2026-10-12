import Panel from './Panel'
import PercentageGauge from './PercentageGauge'

function IndexItem({ title, value, unit }) {
  return (
    <div className="kpi-item">
      <p className="kpi-item__title">{title}</p>
      <p className="kpi-item__index">
        {value}
        {unit && value !== '—' ? <span className="kpi-item__unit">{unit}</span> : null}
      </p>
    </div>
  )
}

function GaugeItem({ title, percent }) {
  return (
    <div className="kpi-item">
      <p className="kpi-item__title">{title}</p>
      <PercentageGauge percent={percent} />
    </div>
  )
}

export default function BottomKpiPanel({ items }) {
  const byId = Object.fromEntries(items.map((item) => [item.id, item]))

  return (
    <Panel title="Key Performance Indicators" className="panel--bottom panel--kpi-board">
      <div className="kpi-board">
        <div className="kpi-board__indexes">
          <IndexItem title="KPI-IM1" value={byId['kpi-im1']?.value ?? '—'} />
          <IndexItem title="KPI-ISR" value={byId['kpi-isr']?.value ?? '—'} />
          <IndexItem
            title="Maintenance Compliance"
            value={byId.compliance?.value ?? '—'}
            unit={byId.compliance?.unit}
          />
        </div>
        <div className="kpi-board__gauges">
          <GaugeItem title="Grinding Progress" percent={byId.grinding?.value} />
          <GaugeItem title="Spare Part Availability" percent={byId.spares?.value} />
          <GaugeItem title="Machine Availability" percent={byId.machines?.value} />
        </div>
      </div>
    </Panel>
  )
}
