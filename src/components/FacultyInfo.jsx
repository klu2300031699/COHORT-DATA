import React from 'react'
import './FacultyInfo.css'

export default function FacultyInfo({ facultyData, onReset }) {
  return (
    <div className="faculty-info">
      <div className="faculty-info__header">
        <h3 className="faculty-info__title">Faculty Details</h3>
        <button className="faculty-info__reset-btn" onClick={onReset}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
          </svg>
          Back
        </button>
      </div>
      
      <div className="faculty-info__grid">
        <div className="faculty-info__item">
          <span className="faculty-info__label">Employee ID:</span>
          <span className="faculty-info__value">{facultyData.empId}</span>
        </div>
        
        <div className="faculty-info__item">
          <span className="faculty-info__label">Name:</span>
          <span className="faculty-info__value">{facultyData.empName}</span>
        </div>
        
        <div className="faculty-info__item">
          <span className="faculty-info__label">Cohort:</span>
          <span className="faculty-info__value faculty-info__cohort">{facultyData.cohort}</span>
        </div>
        
        <div className="faculty-info__item">
          <span className="faculty-info__label">Department:</span>
          <span className="faculty-info__value">{facultyData.dept}</span>
        </div>
      </div>
    </div>
  )
}
