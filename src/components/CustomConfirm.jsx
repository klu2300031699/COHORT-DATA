import React from 'react'
import './CustomConfirm.css'

export default function CustomConfirm({ show, title, message, onConfirm, onCancel }) {
  if (!show) return null

  return (
    <div className="custom-confirm-overlay" onClick={onCancel}>
      <div className="custom-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="custom-confirm__icon-wrapper">
          <svg className="custom-confirm__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 20h20L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
            <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="custom-confirm__content">
          <h3 className="custom-confirm__title">{title}</h3>
          <p className="custom-confirm__message">{message}</p>
        </div>
        <button className="custom-confirm__close" onClick={onCancel} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="custom-confirm__actions">
          <button className="custom-confirm__button custom-confirm__button--cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="custom-confirm__button custom-confirm__button--confirm" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
