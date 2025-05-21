import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './Sidebar.css';

export default function Sidebar({ message }) {
  console.log('Mensaje recibido en Sidebar:', message);
  const isAdmin = message === 'Bienvenido, Admin User!';
  console.log('Es Admin:', isAdmin);

  return (
    <nav className="sidebar bg-primary p-3" style={{ width: '280px' }}>      
      <ul className="list-unstyled">
        <li className="mb-3">
          {/* Quitar todas las clases de Bootstrap que puedan interferir */}
          <Link to="/home" className="sidebar-link">
            <i className="bi bi-house-door me-2"></i>
            Inicio
          </Link>
        </li>
        {isAdmin && (
          <>
            <li className="mb-3">
              <Link to="/create-team" className="sidebar-link">
                <i className="bi bi-people me-2"></i>
                Crear Equipo
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/create-group" className="sidebar-link">
                <i className="bi bi-grid me-2"></i>
                Crear Grupos
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/create-stadium" className="sidebar-link">
                <i className="bi bi-building me-2"></i>
                Crear Estadios
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/create-match" className="sidebar-link">
                <i className="bi bi-trophy me-2"></i>
                Crear Partido
              </Link>
            </li>
          </>
        )}
        <li className="mb-3">
          <Link to="/profile" className="sidebar-link">
            <i className="bi bi-person me-2"></i>
            Perfil
          </Link>
        </li>
      </ul>
    </nav>
  );
}