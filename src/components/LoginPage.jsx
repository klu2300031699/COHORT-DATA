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
          const isAdmin = ['Gnanesh', '4868', '1277', '8068', '8964', '6799', '5291', '9122', '8215', '1513'].includes(id.trim())

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
            <div className="login-page__logo-brand">
              <span className="login-page__logo-title">School Of Computing</span>
              <span className="login-page__badge">PORTAL</span>
            </div>
            <div className="login-page__logo-subtitle">Faculty Option Portal</div>
          </div>
        </div>

        <div className="login-page__header-center">
          <h1 className="login-page__header-title">Koneru Lakshmaiah Education Foundation</h1>
          <h2 className="login-page__header-subtitle">FACULTY OPTION PORTAL</h2>
          <p className="login-page__header-department">Department of Computer Science & Engineering</p>
        </div>

        <div className="login-page__header-right">
          <button className="login-page__header-btn" onClick={handleLoginClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            Sign In
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="login-page__content">
        <div className="login-page__card">
          <div className="portal-pill-badge portal-pill-badge--gold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
            </svg>
            <span>FACULTY OPTION PORTAL</span>
          </div>

          <h1 className="login-page__heading">Welcome to KLU</h1>
          <h2 className="login-page__subheading">Faculty Option Portal</h2>
          <p className="login-page__description">
            A central executive platform for real-time course allocation, workload management, academic evaluations, and faculty teaching option submissions for the upcoming semester.
          </p>

          <button className="login-page__btn" onClick={handleLoginClick}>
            Sign In to Portal
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
          </button>
        </div>
      </div>

      {showModal && (
        <div className="login-modal-overlay" onClick={handleCancel}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="login-modal__close-btn" onClick={handleCancel} title="Close">
              ✕
            </button>
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
