import React from 'react'
import './Header.css'

export default function Header({ user, onLogout }) {
  return (
    <header className="registration-header">
      <div className="registration-header__logo-section">
        <img src="/logo.jpg" alt="logo" className="registration-header__logo" />
        <div className="registration-header__logo-text">
          <div className="registration-header__logo-title">KL CSE-4</div>
          <div className="registration-header__logo-subtitle">Faculty Option Portal</div>
        </div>
      </div>

      <div className="registration-header__inner">
        <h1 className="registration-header__title">Koneru Lakshmaiah Education Foundation</h1>
        <h2 className="registration-header__subtitle">Faculty Option Portal</h2>
        <p className="registration-header__department">Department of CSE-4</p>
      </div>

      <div className="registration-header__right">
        {user && (
          <>
            <div className="registration-header__user-info">
              <span className="registration-header__user-id">{user.id}</span>
            </div>
            <button className="registration-header__logout-btn" onClick={onLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  )
}
