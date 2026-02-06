import React from 'react'
import './CustomAlert.css'

export default function CustomAlert({ show, type = 'info', title, message, onClose }) {
  if (!show) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="custom-alert__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'error':
        return (
          <svg className="custom-alert__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M15 9L9 15M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )
      case 'warning':
        return (
          <svg className="custom-alert__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 20h20L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
            <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )
      default:
        return (
          <svg className="custom-alert__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )
    }
  }

  return (
    <div className="custom-alert-overlay" onClick={onClose}>
      <div className={`custom-alert custom-alert--${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="custom-alert__icon-wrapper">
          {getIcon()}
        </div>
        <div className="custom-alert__content">
          {title && <h3 className="custom-alert__title">{title}</h3>}
          <p className="custom-alert__message">{message}</p>
        </div>
        <button className="custom-alert__close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="custom-alert__actions">
          <button className="custom-alert__button" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
