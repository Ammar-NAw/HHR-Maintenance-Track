import { Fence, Split, Timer, TrainFront } from 'lucide-react'
import Panel from './Panel'

const NUMBER_FORMAT = new Intl.NumberFormat('en-US')

const ASSET_META = {
  Fence: { icon: Fence, tone: 'teal' },
  Track: { icon: TrainFront, tone: 'navy' },
  Turnout: { icon: Split, tone: 'mint' },
}

export default function MtbfPanel({ data }) {
  const loadedHours = data.map((item) => item.hours).filter((hours) => hours != null)
  const best = loadedHours.length > 1 ? Math.max(...loadedHours) : null

  return (
    <Panel
      title="MTBF (Hours)"
      subtitle="Mean time between failures by asset"
      className="panel--mtbf"
    >
      <div className="mtbf-tree">
        <div className="mtbf-tree__root">
          <Timer size={20} strokeWidth={2.2} />
          <span>Hours</span>
        </div>

        <div className="mtbf-tree__links" aria-hidden="true">
          <span className="mtbf-tree__trunk" />
          <span className="mtbf-tree__rail" />
          <span className="mtbf-tree__arm mtbf-tree__arm--left" />
          <span className="mtbf-tree__arm mtbf-tree__arm--mid" />
          <span className="mtbf-tree__arm mtbf-tree__arm--right" />
        </div>

        <div className="mtbf-tree__leaves">
          {data.map((item) => {
            const meta = ASSET_META[item.asset]
            const Icon = meta.icon
            const isBest = best != null && item.hours === best

            return (
              <article
                key={item.asset}
                className={`mtbf-tree__leaf mtbf-tree__leaf--${meta.tone}${isBest ? ' mtbf-tree__leaf--best' : ''}`}
              >
                <span className="mtbf-tree__leaf-icon" aria-hidden="true">
                  <Icon size={17} strokeWidth={2.1} />
                </span>
                <span className="mtbf-tree__leaf-name">{item.asset}</span>
                <strong className="mtbf-tree__leaf-value">
                  {item.hours == null ? '—' : NUMBER_FORMAT.format(item.hours)}
                </strong>
              </article>
            )
          })}
        </div>
      </div>
    </Panel>
  )
}
