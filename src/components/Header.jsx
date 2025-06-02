import React from 'react';
import './Header.css';

export default function Header({ message, onLogout, toggleSidebar }) {
  return (
    <header className="app-header">
      {/* Botón hamburguesa para pantallas pequeñas */}
      <button 
        className="btn-menu d-lg-none"
        onClick={toggleSidebar}
        aria-label="Menú"
      >
        <i className="bi bi-list"></i>
      </button>
      
      <div className="flex-spacer"></div>
      
      <div className="header-content">
        <span className="header-message">{message}</span>
        <button className="logout-button" onClick={onLogout} title="Cerrar Sesión">
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </header>
  );
}