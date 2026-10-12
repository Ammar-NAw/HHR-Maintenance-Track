import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Panel from './Panel'
import { TQI_THRESHOLD } from '../utils/excelParser'
import { chartTooltipStyle } from '../styles/chartTheme'

function tqiDomain(hasData) {
  if (!hasData) {
    return [TQI_THRESHOLD - 0.1, TQI_THRESHOLD + 0.1]
  }
  return [
    (dataMin) => {
      const min = Math.min(Number(dataMin), TQI_THRESHOLD)
      return Number.isFinite(min) ? min - 0.05 : TQI_THRESHOLD - 0.05
    },
    (dataMax) => {
      const max = Math.max(Number(dataMax), TQI_THRESHOLD)
      return Number.isFinite(max) ? max + 0.05 : TQI_THRESHOLD + 0.05
    },
  ]
}

function formatTqiLabel(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  return n.toFixed(3)
}

function TqiDot({ color, dataKey }) {
  return function Dot(props) {
    const { cx, cy, payload } = props
    if (cx == null || cy == null) return null
    const value = payload?.[dataKey]
    const n = Number(value)
    if (!Number.isFinite(n)) return null

    const otherKey = dataKey === 'TRK1' ? 'TRK2' : 'TRK1'
    const other = Number(payload?.[otherKey])
    const close = Number.isFinite(other) && Math.abs(n - other) < 0.012
    const preferAbove = dataKey === 'TRK1' ? n >= other || !Number.isFinite(other) : n > other
    let side = dataKey === 'TRK1' ? 'above' : 'below'
    if (close) side = preferAbove ? 'above' : 'below'
    if (cy < 16) side = 'below'
    if (cy > 118) side = 'above'

    const label = formatTqiLabel(n)
    const exceeded = n > TQI_THRESHOLD
    const labelY = side === 'above' ? cy - 10 : cy + 13
    const labelX = close && dataKey === 'TRK2' ? cx + 10 : close && dataKey === 'TRK1' ? cx - 10 : cx

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={exceeded ? 5 : 3}
          fill={exceeded ? '#dc2626' : color}
          stroke={exceeded ? '#991b1b' : color}
          strokeWidth={exceeded ? 1.6 : 0}
        >
          {exceeded ? <title>{`${dataKey} ${label} exceeds TQI0 threshold 0.6`}</title> : null}
        </circle>
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          fill={exceeded ? '#991b1b' : color}
          fontSize={9}
          fontWeight={700}
          fontVariant="tabular-nums"
        >
          {label}
        </text>
      </g>
    )
  }
}

export default function TqiChart({ data }) {
  const hasData = Array.isArray(data) && data.length > 0

  return (
    <Panel
      title="Track Quality Index (TQI)"
      subtitle="Monthly trend · TRK1 (Line 1) and TRK2 (Line 2)"
    >
      <div className="chart-frame chart-frame--tqi">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={hasData ? data : []} margin={{ top: 14, right: 12, left: -16, bottom: 8 }}>
            <CartesianGrid stroke="#e6edf2" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#4a5d73', fontSize: 12 }}
              axisLine={{ stroke: '#d5dee8' }}
              tickLine={false}
            />
            <YAxis
              type="number"
              domain={tqiDomain(hasData)}
              tick={{ fill: '#4a5d73', fontSize: 11 }}
              tickFormatter={(value) => Number(value).toFixed(2)}
              axisLine={false}
              tickLine={false}
              allowDecimals
            />
            {hasData ? (
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value, name) => {
                  const n = Number(value)
                  const label = Number.isFinite(n) ? n.toFixed(3) : value
                  const note = n > TQI_THRESHOLD ? ' · threshold exceeded' : ''
                  return [`${label}${note}`, name]
                }}
              />
            ) : null}
            <Legend
              iconType="plainline"
              wrapperStyle={{ fontSize: 11, color: '#1a365d', paddingTop: 2 }}
            />
            <ReferenceLine
              y={TQI_THRESHOLD}
              stroke="#b45309"
              strokeDasharray="5 4"
              ifOverflow="extendDomain"
              label={{
                value: 'TQI0 Threshold – 0.6',
                fill: '#b45309',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
            {hasData ? (
              <>
                <Line
                  type="monotone"
                  dataKey="TRK1"
                  name="TRK1 (Line 1)"
                  stroke="#0d9488"
                  strokeWidth={2.4}
                  dot={TqiDot({ color: '#0d9488', dataKey: 'TRK1' })}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="TRK2"
                  name="TRK2 (Line 2)"
                  stroke="#1e3a5f"
                  strokeWidth={2.4}
                  dot={TqiDot({ color: '#1e3a5f', dataKey: 'TRK2' })}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </>
            ) : null}
          </LineChart>
        </ResponsiveContainer>
        {hasData ? null : <p className="empty-note empty-note--overlay">No data loaded</p>}
      </div>
    </Panel>
  )
}
