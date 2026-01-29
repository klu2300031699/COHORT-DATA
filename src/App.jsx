import React, { useState } from 'react'
import Header from './components/Header'
import LoginPage from './components/LoginPage'
import AdminSearch from './components/AdminSearch'
import FacultyDashboard from './components/FacultyDashboard'
import './App.css'

function App() {
  const [user, setUser] = useState(null)

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    setUser(null)
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
