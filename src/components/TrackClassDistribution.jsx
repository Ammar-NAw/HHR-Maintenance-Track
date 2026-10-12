import { useState } from 'react'
import Panel from './Panel'

const TRACK_CLASSES = ['A', 'B', 'C', 'D', 'E']

function hasClassData(data) {
  return data.some((group) =>
    group.lines.some((line) =>
      TRACK_CLASSES.some((cls) => line.values?.[cls] != null),
    ),
  )
}

export default function TrackClassDistribution({ data }) {
  const [tooltip, setTooltip] = useState(null)
  const loaded = hasClassData(data)

  function updateTooltip(event, nextTooltip) {
    const offset = 14
    const width = 168
    const height = 86
    const x = Math.min(event.clientX + offset, window.innerWidth - width - 8)
    const y = Math.min(event.clientY + offset, window.innerHeight - height - 8)

    setTooltip({
      ...nextTooltip,
      x: Math.max(8, x),
      y: Math.max(8, y),
    })
  }

  return (
    <Panel
      title="Track Class Distribution"
      subtitle="A = best condition · E = lowest condition"
      className="panel--track-class"
    >
      <div className="class-legend" aria-hidden="true">
        {TRACK_CLASSES.map((cls, index) => (
          <span key={cls} className={`class-legend__item class-legend__item--${cls}`}>
            <i />
            {cls}
            {index === 0 ? ' best' : ''}
            {index === TRACK_CLASSES.length - 1 ? ' lowest' : ''}
          </span>
        ))}
      </div>

      <div className="class-groups">
        {data.map((group) => (
          <div key={group.type} className="class-group">
            <h3 className="class-group__title">{group.type}</h3>
            {group.lines.map((line) => (
              <div key={`${group.type}-${line.name}`} className="class-row">
                <span className="class-row__label">{line.name}</span>
                <div
                  className="class-row__bar"
                  role="img"
                  aria-label={`${group.type} ${line.name} class distribution`}
                >
                  {loaded
                    ? TRACK_CLASSES.map((cls) => {
                        const value = line.values[cls]
                        if (value == null) return null
                        return (
                          <div
                            key={cls}
                            className={`class-seg class-seg--${cls}${value > 0 && value < 8 ? ' class-seg--compact' : ''}`}
                            style={{ width: `${value}%` }}
                            onMouseOver={(event) =>
                              updateTooltip(event, {
                                cls,
                                value,
                                type: group.type,
                                line: line.name,
                              })
                            }
                            onMouseMove={(event) =>
                              updateTooltip(event, {
                                cls,
                                value,
                                type: group.type,
                                line: line.name,
                              })
                            }
                            onMouseOut={(event) => {
                              if (!event.currentTarget.contains(event.relatedTarget)) {
                                setTooltip(null)
                              }
                            }}
                          >
                            {value >= 8 ? <strong>{value}%</strong> : ''}
                          </div>
                        )
                      })
                    : null}
                </div>
              </div>
            ))}
          </div>
        ))}
        {loaded ? null : <p className="empty-note empty-note--overlay">No data loaded</p>}
      </div>

      {tooltip ? (
        <div
          className="class-tooltip"
          role="tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="class-tooltip__class">Class {tooltip.cls}</p>
          <p className="class-tooltip__value">{tooltip.value}%</p>
          <p className="class-tooltip__meta">
            {tooltip.type} – {tooltip.line}
          </p>
        </div>
      ) : null}
    </Panel>
  )
}
