import React, { useState, useEffect, useCallback } from 'react'
import './CohortTracker.css'

const BACKEND_URL = 'https://cohort-backend-production.up.railway.app'

export default function CohortTracker({ onClose }) {
  const [allFaculty, setAllFaculty] = useState([])       // All faculty from CSV
  const [submittedIds, setSubmittedIds] = useState(new Set())  // IDs that have submitted
  const [cohorts, setCohorts] = useState([])               // Unique cohort list
  const [selectedCohort, setSelectedCohort] = useState('')
  const [loading, setLoading] = useState(true)

  // Robust CSV parser for quoted fields with commas
  const parseCSVLine = (line) => {
    const columns = []
    let current = ''
    let inQuotes = false
    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        columns.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    columns.push(current.trim())
    return columns
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [facultyRes, submissionsRes] = await Promise.all([
        fetch('/faculty data.csv'),
        fetch(`${BACKEND_URL}/api/faculty/all`)
      ])

      // Parse faculty CSV
      const text = await facultyRes.text()
      const lines = text.split('\n')
      const facultyList = []
      const seenIds = new Set()

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const columns = parseCSVLine(line)
        const empId = columns[0]?.trim()

        // Skip header lines and empty rows
        if (!empId || empId === 'empid' || !/^\d+$/.test(empId)) continue

        // Skip duplicate entries (keep first occurrence)
        if (seenIds.has(empId)) continue
        seenIds.add(empId)

        const cohortRaw = columns[3]?.trim() || ''
        const cohortCode = cohortRaw.replace(/^Cohort\s+/i, '')

        // Skip faculty with no cohort assignment or cohort 999
        if (!cohortCode || cohortCode === '999') continue

        facultyList.push({
          empId,
          name: columns[1]?.trim() || '',
          designation: columns[2]?.trim() || '',
          cohort: cohortCode,
          cohortName: columns[4]?.trim() || '',
          mobile: columns[5]?.trim() || ''
        })
      }

      setAllFaculty(facultyList)

      // Extract unique cohorts and sort
      const cohortSet = new Set(facultyList.map(f => f.cohort))
      const sortedCohorts = Array.from(cohortSet).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0
        const numB = parseInt(b.replace(/\D/g, '')) || 0
        return numA - numB
      })
      setCohorts(sortedCohorts)

      // Parse submitted employee IDs
      if (submissionsRes.ok) {
        const data = await submissionsRes.json()
        const ids = new Set(data.map(r => r.employeeId))
        setSubmittedIds(ids)
      }
    } catch (err) {
      console.error('Error loading cohort tracker data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filter faculty by selected cohort
  const cohortFaculty = selectedCohort
    ? allFaculty.filter(f => f.cohort === selectedCohort)
    : []

  const filledFaculty = cohortFaculty.filter(f => submittedIds.has(f.empId))
  const unfilledFaculty = cohortFaculty.filter(f => !submittedIds.has(f.empId))

  const totalCount = cohortFaculty.length
  const filledCount = filledFaculty.length
  const unfilledCount = unfilledFaculty.length
  const progressPercent = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0

  // Get cohort name for the selected cohort
  const selectedCohortName = selectedCohort
    ? (cohortFaculty[0]?.cohortName || selectedCohort)
    : ''

  return (
    <div className="cohort-tracker-overlay" onClick={onClose}>
      <div className="cohort-tracker" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cohort-tracker__header">
          <div className="cohort-tracker__header-left">
            <svg className="cohort-tracker__header-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <h2 className="cohort-tracker__title">Cohort Submission Tracker</h2>
          </div>
          <button className="cohort-tracker__close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="cohort-tracker__body">
          {loading ? (
            <div className="cohort-tracker__loading">
              <div className="cohort-tracker__spinner"></div>
              <span className="cohort-tracker__loading-text">Loading faculty data...</span>
            </div>
          ) : (
            <>
              {/* Cohort Selector */}
              <div className="cohort-tracker__selector">
                <label className="cohort-tracker__selector-label">Select Cohort</label>
                <select
                  className="cohort-tracker__select"
                  value={selectedCohort}
                  onChange={(e) => setSelectedCohort(e.target.value)}
                >
                  <option value="">— Choose a cohort —</option>
                  {cohorts.map(c => {
                    const sample = allFaculty.find(f => f.cohort === c)
                    const cName = sample?.cohortName || c
                    const cCount = allFaculty.filter(f => f.cohort === c).length
                    return (
                      <option key={c} value={c}>
                        {c} — {cName} ({cCount} faculty)
                      </option>
                    )
                  })}
                </select>
              </div>

              {selectedCohort ? (
                <>
                  {/* Summary Stats */}
                  <div className="cohort-tracker__summary">
                    <div className="cohort-tracker__stat-card cohort-tracker__stat-card--total">
                      <div className="cohort-tracker__stat-number">{totalCount}</div>
                      <div className="cohort-tracker__stat-label">Total Faculty</div>
                    </div>
                    <div className="cohort-tracker__stat-card cohort-tracker__stat-card--filled">
                      <div className="cohort-tracker__stat-number">{filledCount}</div>
                      <div className="cohort-tracker__stat-label">Filled</div>
                    </div>
                    <div className="cohort-tracker__stat-card cohort-tracker__stat-card--unfilled">
                      <div className="cohort-tracker__stat-number">{unfilledCount}</div>
                      <div className="cohort-tracker__stat-label">Unfilled</div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="cohort-tracker__progress-section">
                    <div className="cohort-tracker__progress-header">
                      <span className="cohort-tracker__progress-text">
                        {selectedCohort} — {selectedCohortName}
                      </span>
                      <span className="cohort-tracker__progress-percent">{progressPercent}%</span>
                    </div>
                    <div className="cohort-tracker__progress-bar">
                      <div
                        className="cohort-tracker__progress-fill"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Two-Column Lists */}
                  <div className="cohort-tracker__lists">
                    {/* Unfilled Panel */}
                    <div className="cohort-tracker__list-panel cohort-tracker__list-panel--unfilled">
                      <div className="cohort-tracker__list-header">
                        <div className="cohort-tracker__list-header-left">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                          </svg>
                          Unfilled
                        </div>
                        <span className="cohort-tracker__list-count">{unfilledCount}</span>
                      </div>
                      <div className="cohort-tracker__list-body">
                        {unfilledFaculty.length === 0 ? (
                          <div className="cohort-tracker__empty">🎉 All faculty have submitted!</div>
                        ) : (
                          unfilledFaculty.map((f, idx) => (
                            <div className="cohort-tracker__faculty-row" key={f.empId}>
                              <div className="cohort-tracker__faculty-sno">{idx + 1}</div>
                              <div className="cohort-tracker__faculty-info">
                                <div className="cohort-tracker__faculty-name">{f.name}</div>
                                <div className="cohort-tracker__faculty-id">ID: {f.empId}</div>
                              </div>
                              {f.mobile && (
                                <span className="cohort-tracker__faculty-mobile">📱 {f.mobile}</span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Filled Panel */}
                    <div className="cohort-tracker__list-panel cohort-tracker__list-panel--filled">
                      <div className="cohort-tracker__list-header">
                        <div className="cohort-tracker__list-header-left">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                          Filled
                        </div>
                        <span className="cohort-tracker__list-count">{filledCount}</span>
                      </div>
                      <div className="cohort-tracker__list-body">
                        {filledFaculty.length === 0 ? (
                          <div className="cohort-tracker__empty">No submissions yet for this cohort</div>
                        ) : (
                          filledFaculty.map((f, idx) => (
                            <div className="cohort-tracker__faculty-row" key={f.empId}>
                              <div className="cohort-tracker__faculty-sno">{idx + 1}</div>
                              <div className="cohort-tracker__faculty-info">
                                <div className="cohort-tracker__faculty-name">{f.name}</div>
                                <div className="cohort-tracker__faculty-id">ID: {f.empId}</div>
                              </div>
                              {f.mobile && (
                                <span className="cohort-tracker__faculty-mobile">📱 {f.mobile}</span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="cohort-tracker__placeholder">
                  <svg className="cohort-tracker__placeholder-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                  </svg>
                  <div className="cohort-tracker__placeholder-text">
                    Select a cohort above to view filled and unfilled faculty members
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
