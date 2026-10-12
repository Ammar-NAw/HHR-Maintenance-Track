function TrackMark() {
  return (
    <svg
      className="hsr-lockup__train"
      viewBox="0 0 96 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {[8, 23, 38, 53, 68, 83].map((x) => (
        <rect key={x} x={x} y="5" width="7" height="26" rx="1.2" fill="#111111" />
      ))}
      <rect x="4" y="10" width="88" height="4.2" rx="1.1" fill="#111111" />
      <rect x="4" y="21.8" width="88" height="4.2" rx="1.1" fill="#111111" />
    </svg>
  )
}

export function OperatorMark() {
  return (
    <div className="brand-mark">
      <div className="hsr-lockup">
        <TrackMark />
        <div className="hsr-lockup__copy">
          <p className="hsr-lockup__name">Saudi Arabia Railways</p>
        </div>
      </div>
    </div>
  )
}

export function ProjectMark() {
  return (
    <div className="brand-mark">
      <div className="hsr-corridor">
        <p className="hsr-lockup__kicker">Haramain High Speed</p>
        <div className="hsr-corridor__line" aria-hidden="true">
          <span>Makkah</span>
          <span className="hsr-corridor__rail">
            <i />
          </span>
          <span>Madinah</span>
        </div>
        <p className="hsr-lockup__meta">Western railway · 449 km</p>
      </div>
    </div>
  )
}
