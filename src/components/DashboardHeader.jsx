import { CalendarDays, Upload } from 'lucide-react'
import { OperatorMark } from './BrandMark'

export default function DashboardHeader({
  reportingPeriod,
  periodOptions,
  onPeriodChange,
  fileInputRef,
  onExcelFile,
  showExcelUpload = true,
}) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__visual" aria-hidden="true">
        <img src="/hhr-banner.jpg?v=15" alt="" />
      </div>
      <img className="dashboard-header__sar" src="/sar-wordmark.png?v=1" alt="SAR" />

      <div className="dashboard-header__copy">
        <OperatorMark />
        <p className="dashboard-header__eyebrow">Infrastructure</p>
        <h1 className="dashboard-header__title">Haramain High Speed Track Maintenance Dashboard</h1>
        <p className="dashboard-header__subtitle">Performance Overview</p>

        <div className="dashboard-header__controls">
          <label className="period-select period-select--month">
            <CalendarDays size={15} strokeWidth={2.1} aria-hidden="true" />
            <span className="sr-only">Reporting period</span>
            <select
              value={reportingPeriod}
              onChange={(event) => onPeriodChange(event.target.value)}
            >
              {periodOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          {showExcelUpload ? (
            <label className="period-select excel-upload">
              <Upload size={15} strokeWidth={2.1} aria-hidden="true" />
              <span>Upload Excel</span>
              <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) onExcelFile(file)
                }}
              />
            </label>
          ) : null}
        </div>
      </div>
    </header>
  )
}
