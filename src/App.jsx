import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import LoginPage from './components/LoginPage'
import AdminSearch from './components/AdminSearch'
import FacultyDashboard from './components/FacultyDashboard'
import './App.css'

function App() {
  const [user, setUser] = useState(null)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('facultyPortalUser')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (err) {
        console.error('Error parsing stored user:', err)
        localStorage.removeItem('facultyPortalUser')
      }
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    // Store user in localStorage
    localStorage.setItem('facultyPortalUser', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    // Clear user from localStorage
    localStorage.removeItem('facultyPortalUser')
  }

  return (
    <div className="app">
      {!user ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <>
          <Header user={user} onLogout={handleLogout} />
          {user.isAdmin ? (
            <AdminSearch />
          ) : (
            <FacultyDashboard userId={user.id} />
          )}
        </>
      )}
    </div>
  )
}

export default App
