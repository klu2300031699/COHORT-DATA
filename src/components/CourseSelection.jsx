import React, { useState, useEffect } from 'react'
import './CourseSelection.css'

export default function CourseSelection({ cohort, employeeId }) {
  const [courses, setCourses] = useState({})
  const [allCourses, setAllCourses] = useState([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedCourses, setSelectedCourses] = useState([])
  const [coursePriorities, setCoursePriorities] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCourses()
  }, [cohort])

  useEffect(() => {
    if (allCourses.length === 0) return

    // Only display courses when a semester is selected
    if (!selectedSemester) {
      setCourses({})
      return
    }

    // Filter courses by semester
    const filteredCourses = allCourses.filter(c =>
      c.sem?.toUpperCase() === selectedSemester
    )

    // Group by category
    const grouped = {}
    filteredCourses.forEach(course => {
      const category = course.cat || 'Other'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(course)
    })

    setCourses(grouped)
  }, [selectedSemester, allCourses])

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

      // Store all courses
      setAllCourses(allCourses)

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
    // Validation: Check if all selected courses have priorities assigned
    const coursesWithoutPriority = selectedCourses.filter(
      courseCode => !coursePriorities[courseCode]
    )
    if (coursesWithoutPriority.length > 0) {
      alert('⚠️ Please assign priority (Option 1/Option 2/Option 3) to all selected courses.')
      return
    }

    // Get courses by semester
    const oddCourses = allCourses.filter(c => c.sem?.toUpperCase() === 'ODD')
    const evenCourses = allCourses.filter(c => c.sem?.toUpperCase() === 'EVEN')

    const selectedOdd = selectedCourses.filter(code =>
      oddCourses.some(c => c.courseCode === code)
    )
    const selectedEven = selectedCourses.filter(code =>
      evenCourses.some(c => c.courseCode === code)
    )

    // Validation: Check minimum requirements per semester
    const oddRequired = oddCourses.length >= 3 ? 3 : oddCourses.length
    const evenRequired = evenCourses.length >= 3 ? 3 : evenCourses.length

    if (selectedOdd.length < oddRequired) {
      alert(`⚠️ Please select at least ${oddRequired} course(s) from ODD semester.\n(${oddCourses.length} courses available)`)
      return
    }

    if (selectedEven.length < evenRequired) {
      alert(`⚠️ Please select at least ${evenRequired} course(s) from EVEN semester.\n(${evenCourses.length} courses available)`)
      return
    }

    // Validation: At least one Option 1 priority from ODD semester
    const option1OddCourses = selectedOdd.filter(
      courseCode => coursePriorities[courseCode] === 'Option 1'
    )
    if (option1OddCourses.length === 0) {
      alert('⚠️ Please select at least ONE course with Option 1 priority from ODD semester.')
      return
    }

    // Validation: At least one Option 1 priority from EVEN semester
    const option1EvenCourses = selectedEven.filter(
      courseCode => coursePriorities[courseCode] === 'Option 1'
    )
    if (option1EvenCourses.length === 0) {
      alert('⚠️ Please select at least ONE course with Option 1 priority from EVEN semester.')
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
        <div className="course-selection__year-heading">
          AY: 2026-27 (ODD & EVEN SEMESTER COURSES)
        </div>
        <div className="course-selection__header">
          <h3 className="course-selection__title">
            Available Courses for Cohort <span className="faculty-card__value faculty-card__cohort">{cohort}</span>
          </h3>
          <div className="course-selection__counter">
            <span className="course-selection__count">{selectedCourses.length}</span>
            <span className="course-selection__count-label">Selected</span>
          </div>
        </div>
        <div className="course-selection__error">{error}</div>
      </div>
    )
  }

  return (
    <div className="course-selection">
      <div className="course-selection__year-heading">
        AY: 2026-27 (ODD & EVEN SEMESTER COURSES)
      </div>

      <div className="course-selection__filters">
        <div className="course-filter">
          <label className="course-filter__label">Academic Year</label>
          <select className="course-filter__select" value="2026-2027" disabled>
            <option value="2026-2027">2026-2027</option>
          </select>
        </div>
        <div className="course-filter">
          <label className="course-filter__label">Semester</label>
          <select
            className="course-filter__select"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">Select Semester</option>
            <option value="ODD">ODD Semester</option>
            <option value="EVEN">EVEN Semester</option>
          </select>
        </div>
      </div>

      <div className="course-selection__header">
        <h3 className="course-selection__title">
          Available Courses for Cohort <span className="course-selection__cohort-badge">{cohort}</span>
        </h3>
        <div className="course-selection__counter">
          <span className="course-selection__count">{selectedCourses.length}</span>
          <span className="course-selection__count-label">Selected</span>
        </div>

      </div>

      {Object.keys(courses).length === 0 ? (
        <div className="course-selection__placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
          <h3 className="course-selection__placeholder-title">Select a Semester to View Courses</h3>
          <p className="course-selection__placeholder-text">
            Please choose either <strong>ODD</strong> or <strong>EVEN</strong> semester from the dropdown above to view and select available courses for your cohort.
          </p>
        </div>
      ) : (
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
                    className={`course-item ${selectedCourses.includes(course.courseCode) ? 'course-item--selected' : ''} course-item--${course.sem?.toLowerCase() === 'odd' ? 'odd' : course.sem?.toLowerCase() === 'even' ? 'even' : ''}`}
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
                        <span className={`course-item__sem course-item__sem--${course.sem?.toLowerCase() === 'odd' ? 'odd' : course.sem?.toLowerCase() === 'even' ? 'even' : 'other'}`}>{course.sem}</span>
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
      )}

      <div className="course-selection__footer">
        <button
          className="course-selection__submit-btn"
          onClick={handleSubmit}
          disabled={selectedCourses.length === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          Submit Selection ({selectedCourses.length} courses)
        </button>
      </div>
    </div>
  )
}
