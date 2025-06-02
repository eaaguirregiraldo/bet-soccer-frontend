import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './Sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faTrophy, faUsers } from '@fortawesome/free-solid-svg-icons';

export default function Sidebar({ message, isOpen, toggleSidebar }) {
  console.log('Mensaje recibido en Sidebar:', message);
  const isAdmin = message === 'Bienvenido, Admin User!';
  
  return (
    <>
      {/* Overlay para cerrar el sidebar en móvil */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
      
      <nav className={`sidebar bg-primary p-3 ${isOpen ? 'open' : ''}`}>
        <div className="d-flex justify-content-between align-items-center mb-4">          
          <button 
            className="btn-close-sidebar d-lg-none" 
            onClick={toggleSidebar} 
            aria-label="Cerrar menú"
          >
            <i className="bi bi-x text-white fs-4"></i>
          </button>
        </div>
          
        <ul className="list-unstyled">
          <li className="mb-3">
            <Link to="/home" className="sidebar-link" onClick={() => window.innerWidth < 992 && toggleSidebar()}>
              <i className="bi bi-house-door me-2"></i>
              Inicio
            </Link>
          </li>
          {/* Opciones solo para usuarios NO administradores */}
          {!isAdmin && (
            <>
              <li className="mb-3">
                <Link to="/bet-match" className="sidebar-link" onClick={() => window.innerWidth < 992 && toggleSidebar()}>
                <FontAwesomeIcon icon={faFutbol} className="me-2" />
                  Apostar
                </Link>
              </li>
              <li className="mb-3">
                <Link to="/group-standings" className="sidebar-link" onClick={() => window.innerWidth < 992 && toggleSidebar()}>
                  <i className="bi bi-trophy me-2"></i>
                  Ver Grupos
                </Link>
              </li>
              <li className="mb-3">
                <Link to="/scoreboard" className="sidebar-link" onClick={() => window.innerWidth < 992 && toggleSidebar()}>
                  <i className="bi bi-award-fill me-2"></i>
                  Tabla de Posiciones Polla
                </Link>
              </li>
            </>
          )}
          {isAdmin && (
            <>
              <li className="mb-3">
                <Link to="/create-team" className="sidebar-link" onClick={() => window.innerWidth < 992 && toggleSidebar()}>
                  <FontAwesomeIcon icon={faFutbol} className="me-2" />
                  Crear Equipo
                </Link>
              </li>
              <li className="mb-3">
                <Link to="/create-group" className="sidebar-link" onClick={() => window.innerWidth < 992 && toggleSidebar()}>
                <FontAwesomeIcon icon={faTrophy} className="me-2" />
                  Crear Grupos
                </Link>
              </li>
              <li className="mb-3">
                <Link to="/create-stadium" className="sidebar-link" onClick={() => window.innerWidth < 992 && toggleSidebar()}>
                  <i className="bi bi-building me-2"></i>
                  Crear Estadios
                </Link>
              </li>
              <li className="mb-3">
                <Link to="/create-match" className="sidebar-link" onClick={() => window.innerWidth < 992 && toggleSidebar()}>
                  <i className="bi bi-check2-square me-2"></i>
                  Crear Partido
                </Link>
              </li>
              <li className="mb-3">
                <Link to="/mass-bets" className="sidebar-link" onClick={() => window.innerWidth < 992 && toggleSidebar()}>
                <i className="bi bi-award-fill me-2"></i>
                  Crear Apuestas Masivas
                </Link>
              </li>
            </>
          )}          
        </ul>
      </nav>
    </>
  );
}