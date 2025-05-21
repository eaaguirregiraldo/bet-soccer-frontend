import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function Header({ message, onLogout }) {
  return (
    <header className="d-flex align-items-center p-2 bg-white text-dark">      
      {/* Espacio a la izquierda que queda vacío */}
      <div className="flex-grow-1"></div>
      
      {/* Contenido alineado a la derecha */}
      <div className="me-3">
        <span className="text-dark fw-bold">{message}</span>
        <button className="btn btn-outline-danger ms-3" onClick={onLogout} title="Cerrar Sesión">
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </header>
  );
}