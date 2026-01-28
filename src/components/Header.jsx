import React from 'react'
import './Header.css'

export default function Header() {
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
        {/* Empty space for future buttons */}
      </div>
    </header>
  )
}
