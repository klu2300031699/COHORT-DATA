import React, { useState, useEffect } from 'react'
import './CourseSelection.css'
import './SubmittedCourses.css'

export default function CourseSelection({ cohort, employeeId, name, department, isAdminView = false }) {
  const [courses, setCourses] = useState({})
  const [allCourses, setAllCourses] = useState([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedCourses, setSelectedCourses] = useState([])
  const [coursePriorities, setCoursePriorities] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [existingSelections, setExistingSelections] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editFormData, setEditFormData] = useState({})

  useEffect(() => {
    loadCourses()
    checkExistingSubmission()
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
  const checkExistingSubmission = async () => {
    try {
      const response = await fetch(`https://cohort-backend-production.up.railway.app/api/faculty/${employeeId}`)
      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          setAlreadySubmitted(true)
          setExistingSelections(data)
        }
      }
    } catch (err) {
      console.log('No existing submission found or error checking:', err)
    }
  }
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
    // Map priority to include level indicator
    const priorityMap = {
      'Option 1': 'Option 1 [High]',
      'Option 2': 'Option 2 [Medium]',
      'Option 3': 'Option 3 [Low]'
    }
    setCoursePriorities(prev => ({
      ...prev,
      [courseCode]: priorityMap[priority] || priority
    }))
  }

  const handleSubmit = async () => {
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

    // Group courses by category for each semester
    const oddCategories = {}
    oddCourses.forEach(course => {
      const cat = course.cat || 'Other'
      if (!oddCategories[cat]) oddCategories[cat] = []
      oddCategories[cat].push(course)
    })

    const evenCategories = {}
    evenCourses.forEach(course => {
      const cat = course.cat || 'Other'
      if (!evenCategories[cat]) evenCategories[cat] = []
      evenCategories[cat].push(course)
    })

    const oddCategoryCount = Object.keys(oddCategories).length
    const evenCategoryCount = Object.keys(evenCategories).length

    // NEW LOGIC: If cohort has < 3 courses total, select all
    const totalCourses = oddCourses.length + evenCourses.length

    if (totalCourses < 3) {
      // Must select all courses
      if (selectedCourses.length < totalCourses) {
        alert(`⚠️ This cohort has less than 3 courses. Please select all ${totalCourses} available courses.`)
        return
      }
    } else {
      // NEW LOGIC: Must select 1 course from each category
      // Check ODD semester categories
      for (const category of Object.keys(oddCategories)) {
        const selectedFromCategory = selectedOdd.filter(code =>
          oddCategories[category].some(c => c.courseCode === code)
        )
        if (selectedFromCategory.length === 0) {
          alert(`⚠️ Please select at least 1 course from category "${category}" in ODD semester.`)
          return
        }
      }

      // Check EVEN semester categories
      for (const category of Object.keys(evenCategories)) {
        const selectedFromCategory = selectedEven.filter(code =>
          evenCategories[category].some(c => c.courseCode === code)
        )
        if (selectedFromCategory.length === 0) {
          alert(`⚠️ Please select at least 1 course from category "${category}" in EVEN semester.`)
          return
        }
      }
    }

    // Validation: At least one Option 1 [High] priority from ODD semester
    const option1OddCourses = selectedOdd.filter(
      courseCode => coursePriorities[courseCode]?.includes('Option 1')
    )
    if (option1OddCourses.length === 0) {
      alert('⚠️ Please select at least ONE course with Option 1 [High] priority from ODD semester.')
      return
    }

    // Validation: At least one Option 1 [High] priority from EVEN semester
    const option1EvenCourses = selectedEven.filter(
      courseCode => coursePriorities[courseCode]?.includes('Option 1')
    )
    if (option1EvenCourses.length === 0) {
      alert('⚠️ Please select at least ONE course with Option 1 [High] priority from EVEN semester.')
      return
    }

    // Prepare data for backend
    const selectedCoursesData = selectedCourses.map(courseCode => {
      const course = allCourses.find(c => c.courseCode === courseCode)
      return {
        courseCode: courseCode,
        courseName: course?.courseTitle || '',
        category: course?.cat || '',
        semester: course?.sem || '',
        priority: coursePriorities[courseCode]
      }
    })

    const submissionData = {
      employeeId,
      name,  // Faculty name
      cohort,
      department,
      selectedCourses: selectedCoursesData
    }

    try {
      const response = await fetch('https://cohort-backend-production.up.railway.app/api/faculty/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Successfully saved to database:', result)

        // Count courses by priority
        const option1Count = selectedCourses.filter(c => coursePriorities[c]?.includes('Option 1')).length
        const option2Count = selectedCourses.filter(c => coursePriorities[c]?.includes('Option 2')).length
        const option3Count = selectedCourses.filter(c => coursePriorities[c]?.includes('Option 3')).length

        alert(`✅ Successfully submitted ${selectedCourses.length} course(s) to database!\n\n` +
          `Employee ID: ${employeeId}\n` +
          `Name: ${name}\n` +
          `Cohort: ${cohort}\n\n` +
          `Priority Breakdown:\n` +
          `🔴 Option 1 [High]: ${option1Count} course(s)\n` +
          `🟡 Option 2 [Medium]: ${option2Count} course(s)\n` +
          `🔵 Option 3 [Low]: ${option3Count} course(s)`)

        // Refresh to show submitted data
        setAlreadySubmitted(true)
        setExistingSelections(result)
      } else {
        const errorText = await response.text()
        alert('❌ Error submitting data: ' + errorText)
        console.error('Submission error:', errorText)
      }
    } catch (err) {
      alert('❌ Error connecting to backend. Please make sure the backend server is running.')
      console.error('Backend connection error:', err)
    }
  }

  const handleEdit = (selection) => {
    setEditingId(selection.id)
    setEditFormData({
      courseCode: selection.courseCode,
      courseName: selection.courseName,
      category: selection.category,
      semester: selection.semester,
      priority: selection.priority
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditFormData({})
  }

  const handleUpdateSubmit = async (id) => {
    try {
      const response = await fetch(`https://cohort-backend-production.up.railway.app/api/faculty/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData)
      })

      if (response.ok) {
        const updated = await response.json()
        setExistingSelections(prev =>
          prev.map(sel => sel.id === id ? updated : sel)
        )
        setEditingId(null)
        setEditFormData({})
        alert('✅ Course updated successfully!')
      } else {
        alert('❌ Error updating course')
      }
    } catch (err) {
      alert('❌ Error connecting to backend')
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this course selection?')) {
      return
    }

    try {
      const response = await fetch(`https://cohort-backend-production.up.railway.app/api/faculty/delete/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setExistingSelections(prev => prev.filter(sel => sel.id !== id))
        alert('✅ Course deleted successfully!')
        
        // If no more selections, reset the view
        if (existingSelections.length === 1) {
          setAlreadySubmitted(false)
        }
      } else {
        alert('❌ Error deleting course')
      }
    } catch (err) {
      alert('❌ Error connecting to backend')
      console.error(err)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm(`Are you sure you want to delete ALL ${existingSelections.length} course selections for this faculty member? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`https://cohort-backend-production.up.railway.app/api/faculty/delete-all/${employeeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setExistingSelections([])
        setAlreadySubmitted(false)
        alert('✅ All course selections deleted successfully!')
      } else {
        alert('❌ Error deleting courses')
      }
    } catch (err) {
      alert('❌ Error connecting to backend')
      console.error(err)
    }
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

  // If user has already submitted, show their selections
  if (alreadySubmitted && existingSelections.length > 0) {
    return (
      <div className="course-selection">
        <div className="course-selection__year-heading">
          AY: 2026-27 (ODD & EVEN SEMESTER COURSES)
        </div>

        <div className="course-selection__header">
          <h3 className="course-selection__title">
            Your Submitted Course Selections
          </h3>
          <div className="course-selection__counter">
            <span className="course-selection__count">{existingSelections.length}</span>
            <span className="course-selection__count-label">Courses</span>
          </div>
        </div>

        <div className="course-selection__info-banner">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <p>
            {isAdminView 
              ? "Admin View: You can edit or delete course selections below." 
              : "You have already submitted your course selections. Contact the administrator if you need to make changes."}
          </p>
        </div>

        {isAdminView && (
          <div className="course-selection__admin-actions">
            <button 
              onClick={handleDeleteAll} 
              className="course-selection__delete-all-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              Delete All Selections
            </button>
          </div>
        )}

        <div className="course-selection__submitted-list">
          {existingSelections.map((selection, index) => (
            <div key={index} className="submitted-course-card">
              {editingId === selection.id ? (
                <div className="submitted-course-card__edit-form">
                  <div className="edit-form__group">
                    <label>Course Code:</label>
                    <input 
                      type="text" 
                      value={editFormData.courseCode} 
                      onChange={(e) => setEditFormData({...editFormData, courseCode: e.target.value})}
                      className="edit-form__input"
                    />
                  </div>
                  <div className="edit-form__group">
                    <label>Course Name:</label>
                    <input 
                      type="text" 
                      value={editFormData.courseName} 
                      onChange={(e) => setEditFormData({...editFormData, courseName: e.target.value})}
                      className="edit-form__input"
                    />
                  </div>
                  <div className="edit-form__group">
                    <label>Category:</label>
                    <input 
                      type="text" 
                      value={editFormData.category} 
                      onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                      className="edit-form__input"
                    />
                  </div>
                  <div className="edit-form__group">
                    <label>Semester:</label>
                    <select 
                      value={editFormData.semester} 
                      onChange={(e) => setEditFormData({...editFormData, semester: e.target.value})}
                      className="edit-form__select"
                    >
                      <option value="ODD">ODD</option>
                      <option value="EVEN">EVEN</option>
                    </select>
                  </div>
                  <div className="edit-form__group">
                    <label>Priority:</label>
                    <select 
                      value={editFormData.priority} 
                      onChange={(e) => setEditFormData({...editFormData, priority: e.target.value})}
                      className="edit-form__select"
                    >
                      <option value="Option 1 [High]">Option 1 [High]</option>
                      <option value="Option 2 [Medium]">Option 2 [Medium]</option>
                      <option value="Option 3 [Low]">Option 3 [Low]</option>
                    </select>
                  </div>
                  <div className="edit-form__actions">
                    <button onClick={() => handleUpdateSubmit(selection.id)} className="edit-form__save-btn">
                      Save
                    </button>
                    <button onClick={handleCancelEdit} className="edit-form__cancel-btn">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="submitted-course-card__header">
                    <span className="submitted-course-card__code">{selection.courseCode}</span>
                    <span className={`submitted-course-card__priority priority--${selection.priority?.toLowerCase().replace(/ /g, '-')}`}>
                      {selection.priority}
                    </span>
                  </div>
                  <h4 className="submitted-course-card__title">{selection.courseName}</h4>
                  <div className="submitted-course-card__details">
                    <span className="submitted-course-card__badge">{selection.category}</span>
                    <span className={`submitted-course-card__sem submitted-course-card__sem--${selection.semester?.toLowerCase()}`}>
                      {selection.semester} Semester
                    </span>
                  </div>
                  {isAdminView && (
                    <div className="submitted-course-card__actions">
                      <button onClick={() => handleEdit(selection)} className="submitted-course-card__edit-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(selection.id)} className="submitted-course-card__delete-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
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
                            <label className={`priority-radio ${coursePriorities[course.courseCode]?.includes('Option 1') ? 'priority-radio--high' : ''}`}>
                              <input
                                type="radio"
                                name={`priority-${course.courseCode}`}
                                value="Option 1"
                                checked={coursePriorities[course.courseCode]?.includes('Option 1')}
                                onChange={(e) => handlePriorityChange(course.courseCode, e.target.value)}
                              />
                              <span className="priority-radio__label">Option 1 [High]</span>
                            </label>
                            <label className={`priority-radio ${coursePriorities[course.courseCode]?.includes('Option 2') ? 'priority-radio--medium' : ''}`}>
                              <input
                                type="radio"
                                name={`priority-${course.courseCode}`}
                                value="Option 2"
                                checked={coursePriorities[course.courseCode]?.includes('Option 2')}
                                onChange={(e) => handlePriorityChange(course.courseCode, e.target.value)}
                              />
                              <span className="priority-radio__label">Option 2 [Medium]</span>
                            </label>
                            <label className={`priority-radio ${coursePriorities[course.courseCode]?.includes('Option 3') ? 'priority-radio--poor' : ''}`}>
                              <input
                                type="radio"
                                name={`priority-${course.courseCode}`}
                                value="Option 3"
                                checked={coursePriorities[course.courseCode]?.includes('Option 3')}
                                onChange={(e) => handlePriorityChange(course.courseCode, e.target.value)}
                              />
                              <span className="priority-radio__label">Option 3 [Low]</span>
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
