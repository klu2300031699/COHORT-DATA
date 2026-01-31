import React, { useState } from 'react'
import './LoginPage.css'

export default function LoginPage({ onLogin }) {
  const [showModal, setShowModal] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLoginClick = () => {
    setShowModal(true)
    setError('')
  }

  const handleCancel = () => {
    setShowModal(false)
    setUsername('')
    setPassword('')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Fetch login.csv
      const response = await fetch('/login.csv')
      const text = await response.text()
      const lines = text.split('\n')
      
      // Parse and validate credentials
      let authenticated = false
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        
        const [id, pwd] = line.split(',')
        if (id?.trim() === username.trim() && pwd?.trim() === password.trim()) {
          authenticated = true
          
          // Check if admin
          const isAdmin = ['Gnanesh', '4868', '1277','8068'].includes(id.trim())
          
          onLogin({
            id: id.trim(),
            isAdmin
          })
          break
        }
      }
      
      if (!authenticated) {
        setError('Invalid username or password')
      }
    } catch (err) {
      setError('Error logging in. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Header */}
      <header className="login-page__header">
        <div className="login-page__logo-section">
          <img src="/logo.jpg" alt="logo" className="login-page__logo" />
          <div className="login-page__logo-text">
            <div className="login-page__logo-title">KL CSE-4</div>
            <div className="login-page__logo-subtitle">Faculty Option Portal</div>
          </div>
        </div>

        <div className="login-page__header-center">
          <h1 className="login-page__header-title">Koneru Lakshmaiah Education Foundation</h1>
          <h2 className="login-page__header-subtitle">Faculty Option Portal</h2>
          <p className="login-page__header-dept">Department of CSE-4</p>
        </div>

        <div className="login-page__header-right">
          <button className="login-page__header-btn" onClick={handleLoginClick}>
            Login
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="login-page__content">
        <div className="login-page__card">
          <h1 className="login-page__heading">Welcome to KLU</h1>
          <h2 className="login-page__subheading">Faculty Option Portal</h2>
          <p className="login-page__description">
            Enables faculty members to select courses they intend to teach for the upcoming semester.
Helps the university plan teaching assignments efficiently.
Ensures accurate course allocation and workload distribution.
          </p>
          <button className="login-page__btn" onClick={handleLoginClick}>
            Login to Continue
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </button>
        </div>
      </div>

      {showModal && (
        <div className="login-modal-overlay" onClick={handleCancel}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="login-modal__title">Login</h2>
            <form onSubmit={handleSubmit} className="login-modal__form">
              <div className="login-modal__field">
                <label htmlFor="username" className="login-modal__label">
                  Username (ID)
                </label>
                <input
                  id="username"
                  type="text"
                  className="login-modal__input"
                  placeholder="Enter your ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
              
              <div className="login-modal__field">
                <label htmlFor="password" className="login-modal__label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="login-modal__input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <p className="login-modal__error">{error}</p>}

              <div className="login-modal__actions">
                <button
                  type="button"
                  className="login-modal__btn login-modal__btn--cancel"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="login-modal__btn login-modal__btn--login"
                  disabled={!username.trim() || !password.trim() || loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
