import { useLayoutEffect, useRef, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import Panel from './Panel'
import TsrTable, { tsrLocationText, tsrMapKp } from './TsrTable'

const MAIN_STATIONS = ['makkah', 'jeddah', 'kaec', 'madinah']
const TSR_SIGN_WIDTH = 16

function positionPercent(kp, maxKp) {
  const n = Number(kp)
  if (!Number.isFinite(n) || !maxKp) return '0%'
  const clamped = Math.min(Math.max(n, 0), maxKp)
  return `${(clamped / maxKp) * 100}%`
}

function kpNumberLabel(kp) {
  const n = Number(kp)
  if (!Number.isFinite(n)) return ''
  return Number.isInteger(n) ? `KP ${n}` : `KP ${Number(n.toFixed(1))}`
}

function stationPlacement(index, total) {
  if (index === 0) return 'start'
  if (index === total - 1) return 'end'
  return 'mid'
}

function clusterOverlappingSigns(tsrs, maxKp, canvasWidth) {
  const sorted = [...tsrs].sort((a, b) => a.mapKp - b.mapKp)
  if (!sorted.length) return []

  const toPx = (kp) => (Number(kp) / maxKp) * canvasWidth
  const clusters = []

  sorted.forEach((tsr) => {
    const last = clusters[clusters.length - 1]
    const previous = last?.items[last.items.length - 1]
    if (previous && toPx(tsr.mapKp) - toPx(previous.mapKp) < TSR_SIGN_WIDTH) {
      last.items.push(tsr)
      return
    }
    clusters.push({ items: [tsr] })
  })

  return clusters.map((cluster) => {
    const items = cluster.items
    const first = items[0]
    return {
      id: items.map((tsr) => tsr.id).join('-'),
      kp: first.mapKp,
      location: first.locationText,
      kpLabel: first.kpLabel,
      count: items.length,
      title: items
        .map((tsr) => `${tsr.locationText} · ${tsr.restriction} · ${tsr.reason}`)
        .join('\n'),
    }
  })
}

export default function RouteOverview({ stations, tsrs = [], maxKp }) {
  const canvasRef = useRef(null)
  const [canvasWidth, setCanvasWidth] = useState(0)
  const routeStations = stations.filter((station) => MAIN_STATIONS.includes(station.id))
  const activeTsrs = tsrs.map((tsr) => {
    const locationText = tsrLocationText(tsr)
    return {
      ...tsr,
      status: 'Active',
      locationText,
      mapKp: tsrMapKp(tsr),
    }
  })
  const tsrMarkers =
    canvasWidth > 0 ? clusterOverlappingSigns(activeTsrs, maxKp, canvasWidth) : activeTsrs.map((tsr) => ({
      id: tsr.id,
      kp: tsr.mapKp,
      location: tsr.locationText,
      kpLabel: tsr.kpLabel,
      count: 1,
      title: `${tsr.locationText} · ${tsr.restriction} · ${tsr.reason}`,
    }))

  useLayoutEffect(() => {
    const el = canvasRef.current
    if (!el) return undefined

    function updateWidth() {
      setCanvasWidth(el.clientWidth)
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Panel
      title="Route Overview & TSR"
      subtitle="Makkah KP 0 to Madinah KP 449"
      className="panel--route"
    >
      <div className="route">
        <div className="route__canvas" ref={canvasRef}>
          <div className="route__track" aria-hidden="true">
            <div className="route__line" />
          </div>

          {routeStations.map((station, index) => (
            <div
              key={station.id}
              className={`route-station route-station--${stationPlacement(index, routeStations.length)}`}
              style={{ left: positionPercent(station.kp, maxKp) }}
            >
              <span className="route-station__marker" />
              <span className="route-station__copy">
                <span className="route-station__name">{station.name}</span>
                <span className="route-station__kp">KP {station.kp}</span>
              </span>
            </div>
          ))}

          {tsrMarkers.map((marker) => (
            <button
              key={marker.id}
              type="button"
              className="route-tsr route-tsr--active"
              style={{ left: positionPercent(marker.kp, maxKp) }}
              title={marker.title}
            >
              <span className="route-tsr__sign">
                <TriangleAlert size={14} strokeWidth={2.4} />
                {marker.count > 1 ? (
                  <span className="route-tsr__count">{marker.count}</span>
                ) : null}
              </span>
              <span className="route-tsr__kp">
                {kpNumberLabel(marker.kp)}
              </span>
              <span className="route-tsr__stem" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <TsrTable tsrs={activeTsrs} />
    </Panel>
  )
}
