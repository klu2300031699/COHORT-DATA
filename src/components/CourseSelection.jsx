import React, { useState, useEffect } from 'react'
import './CourseSelection.css'

export default function CourseSelection({ cohort, employeeId }) {
  const [courses, setCourses] = useState({})
  const [selectedCourses, setSelectedCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCourses()
  }, [cohort])

  const loadCourses = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Fetch both CSV files
      const [y23Response, y24Response] = await Promise.all([
        fetch('/Y23 Data.csv'),
        fetch('/Y24 Data.csv')
      ])
      
      const [y23Text, y24Text] = await Promise.all([
        y23Response.text(),
        y24Response.text()
      ])
      
      // Parse and filter courses by cohort
      const allCourses = []
      
      // Robust CSV parser for quoted fields with commas
      const parseCSV = (text) => {
        const lines = text.split('\n')
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          // Split CSV line respecting quoted fields
          const columns = []
          let current = ''
          let inQuotes = false
          for (let j = 0; j < line.length; j++) {
            const char = line[j]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              columns.push(current)
              current = ''
            } else {
              current += char
            }
          }
          columns.push(current)

          const courseCohort = columns[2]?.trim()
          if (courseCohort === cohort) {
            allCourses.push({
              sNo: columns[0],
              cat: columns[1],
              cohort: columns[2],
              courseCode: columns[3],
              courseTitle: columns[4]?.replace(/^"|"$/g, ''),
              sem: columns[5]?.replace(/^"|"$/g, '')
            })
          }
        }
      }
      
      parseCSV(y23Text)
      parseCSV(y24Text)
      
      if (allCourses.length === 0) {
        setError(`No courses found for cohort ${cohort}`)
        setCourses({})
        setLoading(false)
        return
      }
      
      // Group by category
      const grouped = {}
      allCourses.forEach(course => {
        const category = course.cat || 'Other'
        if (!grouped[category]) {
          grouped[category] = []
        }
        grouped[category].push(course)
      })
      
      setCourses(grouped)
    } catch (err) {
      setError('Error loading courses. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCourseToggle = (courseCode) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseCode)) {
        return prev.filter(code => code !== courseCode)
      } else {
        return [...prev, courseCode]
      }
    })
  }

  const handleSubmit = () => {
    const submissionData = {
      employeeId,
      cohort,
      selectedCourses,
      timestamp: new Date().toISOString()
    }
    
    console.log('Submission Data:', submissionData)
    alert(`Successfully submitted ${selectedCourses.length} course(s)!\n\nEmployee ID: ${employeeId}\nCohort: ${cohort}\nCourses: ${selectedCourses.length}`)
    
    // Backend integration will be added later
  }

  if (loading) {
    return (
      <div className="course-selection">
        <div className="course-selection__loading">
          <div className="course-selection__spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="course-selection">
        <div className="course-selection__error">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="course-selection">
      <div className="course-selection__header">
        <h3 className="course-selection__title">
          Available Courses for Cohort <span className="course-selection__cohort-badge">{cohort}</span>
        </h3>
        <div className="course-selection__counter">
          <span className="course-selection__count">{selectedCourses.length}</span>
          <span className="course-selection__count-label">Selected</span>
        </div>
      </div>

      <div className="course-selection__categories">
        {Object.keys(courses).sort().map(category => (
          <div key={category} className="course-category">
            <div className="course-category__header">
              <h4 className="course-category__title">{category}</h4>
              <span className="course-category__count">{courses[category].length} courses</span>
            </div>
            
            <div className="course-category__list">
              {courses[category].map(course => (
                <label 
                  key={course.courseCode} 
                  className={`course-item ${selectedCourses.includes(course.courseCode) ? 'course-item--selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="course-item__checkbox"
                    checked={selectedCourses.includes(course.courseCode)}
                    onChange={() => handleCourseToggle(course.courseCode)}
                  />
                  <div className="course-item__content">
                    <div className="course-item__header">
                      <span className="course-item__code">{course.courseCode}</span>
                      <span className="course-item__sem">{course.sem}</span>
                    </div>
                    <p className="course-item__title">{course.courseTitle}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="course-selection__footer">
        <button 
          className="course-selection__submit-btn"
          onClick={handleSubmit}
          disabled={selectedCourses.length === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          Submit Selection ({selectedCourses.length} courses)
        </button>
      </div>
    </div>
  )
}
