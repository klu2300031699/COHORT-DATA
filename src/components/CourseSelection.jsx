import React, { useState, useEffect } from 'react'
import './CourseSelection.css'

export default function CourseSelection({ cohort, employeeId }) {
  const [courses, setCourses] = useState({})
  const [selectedCourses, setSelectedCourses] = useState([])
  const [coursePriorities, setCoursePriorities] = useState({})
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
        // Remove from selected courses and clear priority
        const updated = prev.filter(code => code !== courseCode)
        setCoursePriorities(prevPriorities => {
          const newPriorities = { ...prevPriorities }
          delete newPriorities[courseCode]
          return newPriorities
        })
        return updated
      } else {
        return [...prev, courseCode]
      }
    })
  }

  const handlePriorityChange = (courseCode, priority) => {
    setCoursePriorities(prev => ({
      ...prev,
      [courseCode]: priority
    }))
  }

  const handleSubmit = () => {
    // Get total available courses for this cohort
    const allAvailableCourses = Object.values(courses).flat().map(c => c.courseCode)
    const totalAvailable = allAvailableCourses.length

    // Validation: Check if all selected courses have priorities assigned
    const coursesWithoutPriority = selectedCourses.filter(
      courseCode => !coursePriorities[courseCode]
    )
    if (coursesWithoutPriority.length > 0) {
      alert('⚠️ Please assign priority (Option 1/Option 2/Option 3) to all selected courses.')
      return
    }

    // Validation: Must select at least 3 courses, or all if less than 3 available
    if (totalAvailable >= 3) {
      if (selectedCourses.length < 3) {
        alert('⚠️ Please select at least 3 courses from your cohort.')
        return
      }
    } else {
      if (selectedCourses.length < totalAvailable) {
        alert(`⚠️ Please select all available courses for your cohort (only ${totalAvailable} available).`)
        return
      }
    }

    // Validation: At least one Option 1 priority
    const option1Courses = selectedCourses.filter(
      courseCode => coursePriorities[courseCode] === 'Option 1'
    )
    if (option1Courses.length === 0) {
      alert('⚠️ Please select at least ONE course with Option 1 before submitting.')
      return
    }

    const submissionData = {
      employeeId,
      cohort,
      selectedCourses: selectedCourses.map(courseCode => ({
        courseCode,
        priority: coursePriorities[courseCode]
      })),
      timestamp: new Date().toISOString()
    }
    
    console.log('Submission Data:', submissionData)
    
    // Count courses by priority
    const option1Count = selectedCourses.filter(c => coursePriorities[c] === 'Option 1').length
    const option2Count = selectedCourses.filter(c => coursePriorities[c] === 'Option 2').length
    const option3Count = selectedCourses.filter(c => coursePriorities[c] === 'Option 3').length
    
    alert(`✅ Successfully submitted ${selectedCourses.length} course(s)!\n\n` +
          `Employee ID: ${employeeId}\n` +
          `Cohort: ${cohort}\n\n` +
          `Priority Breakdown:\n` +
          `🔴 Option 1: ${option1Count} course(s)\n` +
          `🟡 Option 2: ${option2Count} course(s)\n` +
          `🔵 Option 3: ${option3Count} course(s)`)
    
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
                  <div className="course-item__checkbox-wrapper">
                    <input
                      type="checkbox"
                      className="course-item__checkbox"
                      checked={selectedCourses.includes(course.courseCode)}
                      onChange={() => handleCourseToggle(course.courseCode)}
                    />
                  </div>
                  <div className="course-item__content">
                    <div className="course-item__header">
                      <span className="course-item__code">{course.courseCode}</span>
                      <span className="course-item__sem">{course.sem}</span>
                    </div>
                    <p className="course-item__title">{course.courseTitle}</p>
                    
                    {selectedCourses.includes(course.courseCode) && (
                      <div className="course-item__priority">
                        <span className="course-item__priority-label">Priority:</span>
                        <div className="course-item__priority-options">
                          <label className={`priority-radio ${coursePriorities[course.courseCode] === 'Option 1' ? 'priority-radio--high' : ''}`}>
                            <input
                              type="radio"
                              name={`priority-${course.courseCode}`}
                              value="Option 1"
                              checked={coursePriorities[course.courseCode] === 'Option 1'}
                              onChange={(e) => handlePriorityChange(course.courseCode, e.target.value)}
                            />
                            <span className="priority-radio__label">Option 1</span>
                          </label>
                          <label className={`priority-radio ${coursePriorities[course.courseCode] === 'Option 2' ? 'priority-radio--medium' : ''}`}>
                            <input
                              type="radio"
                              name={`priority-${course.courseCode}`}
                              value="Option 2"
                              checked={coursePriorities[course.courseCode] === 'Option 2'}
                              onChange={(e) => handlePriorityChange(course.courseCode, e.target.value)}
                            />
                            <span className="priority-radio__label">Option 2</span>
                          </label>
                          <label className={`priority-radio ${coursePriorities[course.courseCode] === 'Option 3' ? 'priority-radio--poor' : ''}`}>
                            <input
                              type="radio"
                              name={`priority-${course.courseCode}`}
                              value="Option 3"
                              checked={coursePriorities[course.courseCode] === 'Option 3'}
                              onChange={(e) => handlePriorityChange(course.courseCode, e.target.value)}
                            />
                            <span className="priority-radio__label">Option 3</span>
                          </label>
                        </div>
                      </div>
                    )}
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
