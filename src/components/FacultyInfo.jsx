
import React from 'react'
import './FacultyInfo.css'

export default function FacultyInfo({ facultyData, onReset }) {
  return (
    <div className="faculty-card">
      <div className="faculty-card__header">
        <div className="faculty-card__avatar">
          {/* Placeholder avatar icon */}
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="28" cy="28" r="28" fill="#880000"/>
            <ellipse cx="28" cy="23" rx="10" ry="10" fill="#fff"/>
            <ellipse cx="28" cy="44" rx="16" ry="8" fill="#fff"/>
          </svg>
        </div>
        <div className="faculty-card__main">
          <div className="faculty-card__name">{facultyData.empName}</div>
          <div className="faculty-card__id">Employee ID: <span>{facultyData.empId}</span></div>
        </div>
        {onReset && (
          <button className="faculty-card__back-btn" onClick={onReset}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#880000" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="#fff" stroke="#880000" strokeWidth="2"/>
              <path d="M15 9l-3 3 3 3" stroke="#880000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            <span>Back</span>
          </button>
        )}
      </div>
      <div className="faculty-card__details">
        <div className="faculty-card__detail">
          <span className="faculty-card__label">Cohort</span>
          <span className="faculty-card__value faculty-card__cohort">{facultyData.cohort}</span>
        </div>
        <div className="faculty-card__detail">
          <span className="faculty-card__label">Department</span>
          <span className="faculty-card__value">{facultyData.dept}</span>
        </div>
      </div>
    </div>
  )
}
