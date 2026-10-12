import Panel from './Panel'

export default function SummaryPanel({ items }) {
  return (
    <Panel title="Summary" className="panel--bottom panel--summary">
      <ul className="summary-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Panel>
  )
}
