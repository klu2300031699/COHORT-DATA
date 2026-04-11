import React, { useState, useEffect } from 'react'
import FacultyInfo from './FacultyInfo'
import CourseSelection from './CourseSelection'
import './AdminSearch.css'

export default function AdminSearch() {
  const [employeeId, setEmployeeId] = useState('')
  const [facultyData, setFacultyData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submissionStats, setSubmissionStats] = useState({ submitted: 0, total: 0, loading: true })

  useEffect(() => {
    fetchSubmissionStats()
  }, [])

  const fetchSubmissionStats = async () => {
    try {
      // Fetch all submissions from backend
      const [submissionsRes, facultyRes] = await Promise.all([
        fetch('https://cohort-backend-production.up.railway.app/api/faculty/all'),
        fetch('/faculty data.csv')
      ])

      let submittedCount = 0
      if (submissionsRes.ok) {
        const data = await submissionsRes.json()
        // Count unique employee IDs
        const uniqueEmployees = new Set(data.map(r => r.employeeId))
        submittedCount = uniqueEmployees.size
      }

      let totalFaculty = 0
      if (facultyRes.ok) {
        const text = await facultyRes.text()
        const lines = text.split('\n')
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (line && line.split(',')[0]?.trim()) totalFaculty++
        }
      }

      setSubmissionStats({ submitted: submittedCount, total: totalFaculty, loading: false })
    } catch (err) {
      console.error('Error fetching stats:', err)
      setSubmissionStats(prev => ({ ...prev, loading: false }))
    }
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setFacultyData(null)

    try {
      const response = await fetch('/faculty data.csv')
      const text = await response.text()
      const lines = text.split('\n')
      
      let found = false
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        
        // New CSV format: empid, name, designation, cohortno, cohortname, mobile
        const columns = parseCSVLine(line)
        const empId = columns[0]?.trim()
        
        if (empId === employeeId.trim()) {
          // Extract cohort code from "Cohort E06" -> "E06"
          const cohortRaw = columns[3]?.trim() || ''
          const cohortCode = cohortRaw.replace(/^Cohort\s+/i, '')
          
          setFacultyData({
            empId: columns[0]?.trim(),
            empName: columns[1]?.trim(),
            designation: columns[2]?.trim(),
            cohort: cohortCode,
            cohortName: columns[4]?.trim(),
            mobile: columns[5]?.trim()
          })
          found = true
          break
        }
      }
      
      if (!found) {
        setError('Employee ID not found. Please check and try again.')
      }
    } catch (err) {
      setError('Error loading data. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setEmployeeId('')
    setFacultyData(null)
    setError('')
  }

  return (
    <div className="admin-search">
      <div className="admin-search__container">
        <div className="admin-search__header">
          <svg 
            className="admin-search__icon" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <h2 className="admin-search__title">Search Faculty by Employee ID</h2>
        </div>

        {/* Submission Stats */}
        {!submissionStats.loading && (
          <div className="admin-search__stats">
            <div className="admin-search__stats-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <div className="admin-search__stats-info">
                <span className="admin-search__stats-label">Faculty Submissions</span>
                <span className="admin-search__stats-value">
                  <strong>{submissionStats.submitted}</strong> / {submissionStats.total} faculty submitted
                </span>
              </div>
              <div className="admin-search__stats-progress">
                <div
                  className="admin-search__stats-fill"
                  style={{ width: submissionStats.total > 0 ? `${(submissionStats.submitted / submissionStats.total) * 100}%` : '0%' }}
                ></div>
              </div>
              <span className="admin-search__stats-percent">
                {submissionStats.total > 0 ? Math.round((submissionStats.submitted / submissionStats.total) * 100) : 0}%
              </span>
            </div>
          </div>
        )}
        
        {!facultyData ? (
          <form onSubmit={handleSubmit} className="admin-search__form">
            <label htmlFor="employee-id" className="admin-search__label">
              Employee ID
            </label>
            <div className="admin-search__input-group">
              <input
                id="employee-id"
                type="text"
                className="admin-search__input"
                placeholder="Enter Employee ID (e.g., 4868)"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
              <button 
                type="submit" 
                className="admin-search__submit"
                disabled={!employeeId.trim() || loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            {error && <p className="admin-search__error">{error}</p>}
          </form>
        ) : (
          <>
            <FacultyInfo facultyData={facultyData} onReset={handleReset} />
            <CourseSelection 
              cohort={facultyData.cohort} 
              employeeId={facultyData.empId} 
              name={facultyData.empName}
              cohortName={facultyData.cohortName}
              isAdminView={true} 
            />
          </>
        )}
      </div>
    </div>
  )
}
