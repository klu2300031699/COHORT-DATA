import React, { useState } from 'react'
import FacultyInfo from './FacultyInfo'
import CourseSelection from './CourseSelection'
import './AdminSearch.css'

export default function AdminSearch() {
  const [employeeId, setEmployeeId] = useState('')
  const [facultyData, setFacultyData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setFacultyData(null)

    try {
      const response = await fetch('/Faculty details.csv')
      const text = await response.text()
      const lines = text.split('\n')
      
      let found = false
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        
        const columns = line.split(',')
        const empId = columns[1]?.trim()
        
        if (empId === employeeId.trim()) {
          setFacultyData({
            sNo: columns[0],
            empId: columns[1],
            empName: columns[2],
            cohort: columns[3],
            dept: columns[4]
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
              department={facultyData.dept}
              isAdminView={true} 
            />
          </>
        )}
      </div>
    </div>
  )
}
