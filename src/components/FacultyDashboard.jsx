import React, { useState, useEffect } from 'react'
import FacultyInfo from './FacultyInfo'
import CourseSelection from './CourseSelection'
import './FacultyDashboard.css'

export default function FacultyDashboard({ userId }) {
  const [facultyData, setFacultyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFacultyData()
  }, [userId])

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

  const loadFacultyData = async () => {
    setLoading(true)
    setError('')

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

        if (empId === userId) {
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
        setError('Your faculty details were not found in the system. Please contact the administrator.')
      }
    } catch (err) {
      setError('Error loading your data. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="faculty-dashboard">
        <div className="faculty-dashboard__loading">
          <div className="faculty-dashboard__spinner"></div>
          <p>Loading your information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="faculty-dashboard">
        <div className="faculty-dashboard__error">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="faculty-dashboard">
      <div className="faculty-dashboard__container">
        <FacultyInfo facultyData={facultyData} onReset={null} />
        <CourseSelection
          cohort={facultyData.cohort}
          employeeId={facultyData.empId}
          name={facultyData.empName}
          cohortName={facultyData.cohortName}
          isAdminView={false}
        />
      </div>
    </div>
  )
}
