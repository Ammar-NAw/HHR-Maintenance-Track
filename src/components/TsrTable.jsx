export function tsrLocationText(tsr) {
  const location = String(tsr?.location ?? '').trim()
  const kpLabel = String(tsr?.kpLabel ?? '').trim()
  if (location && /\bkp\b/i.test(location)) return location
  if (location && kpLabel) return `${location} ${kpLabel}`
  return location || kpLabel || '—'
}

export function tsrMapKp(tsr) {
  const text = tsrLocationText(tsr)
  const afterKp = text.match(/\bKP\s*([0-9]+(?:\.[0-9]+)?)/i)
  if (afterKp) return Number(afterKp[1])
  const fallback = Number(tsr?.kp)
  return Number.isFinite(fallback) ? fallback : 0
}

export default function TsrTable({ tsrs }) {
  return (
    <div className="table-wrap">
      <div className="data-table" role="table">
        <div className="data-table__head" role="row">
          <span role="columnheader">Location / KP</span>
          <span role="columnheader">Track</span>
          <span role="columnheader">Restriction</span>
          <span role="columnheader">Reason</span>
        </div>

        <div className="data-table__body" role="rowgroup">
          {tsrs.length === 0 ? (
            <p className="data-table__empty">No data loaded</p>
          ) : (
            tsrs.map((tsr) => (
              <div key={tsr.id} className="data-table__row" role="row">
                <span role="cell" title={tsrLocationText(tsr)}>{tsrLocationText(tsr)}</span>
                <span role="cell">{tsr.track || '—'}</span>
                <span role="cell">{tsr.restriction || '—'}</span>
                <span role="cell">{tsr.reason || '—'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
