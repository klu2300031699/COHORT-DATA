import React from 'react'
import './Header.css'

export default function Header({ user, onLogout }) {
  const handleExportReport = async () => {
    try {
      const response = await fetch('https://cohort-backend-production.up.railway.app/api/faculty/all')
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
      
      const data = await response.json()
      
      if (data.length === 0) {
        alert('No data available to export')
        return
      }
      
      // Convert JSON to CSV
      const headers = ['ID', 'Employee ID', 'Faculty Name', 'Cohort', 'Department', 'Course Code', 'Course Name', 'Category', 'Semester', 'Priority']
      const csvRows = [headers.join(',')]
      
      data.forEach(item => {
        const row = [
          item.id || '',
          item.employeeId || '',
          `"${(item.facultyName || '').replace(/"/g, '""')}"`,
          item.cohort || '',
          item.department || '',
          item.courseCode || '',
          `"${(item.courseName || '').replace(/"/g, '""')}"`,
          item.category || '',
          item.semester || '',
          item.priority || ''
        ]
        csvRows.push(row.join(','))
      })
      
      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `Faculty_Course_Selections_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      alert(`✅ Successfully exported ${data.length} records!`)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('❌ Error exporting data. Please try again.')
    }
  }

  return (
    <header className="registration-header">
      <div className="registration-header__logo-section">
        <img src="/logo.jpg" alt="logo" className="registration-header__logo" />
        <div className="registration-header__logo-text">
          <div className="registration-header__logo-title">KL CSE-4</div>
          <div className="registration-header__logo-subtitle">Faculty Option Portal</div>
        </div>
      </div>

      <div className="registration-header__inner">
        <h1 className="registration-header__title">Koneru Lakshmaiah Education Foundation</h1>
        <h2 className="registration-header__subtitle">Faculty Option Portal</h2>
        <p className="registration-header__department">Department of CSE-4</p>
      </div>

      <div className="registration-header__right">
        {user && (
          <>
            <div className="registration-header__user-info">
              {user.isAdmin && (
                <button className="registration-header__report-btn" onClick={handleExportReport}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
                  Report
                </button>
              )}
              <span className="registration-header__user-id">{user.id}</span>
            </div>
            <button className="registration-header__logout-btn" onClick={onLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  )
}
