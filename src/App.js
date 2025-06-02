import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import Register from './components/Register';
import CreateTeam from './components/CreateTeam';
import CreateGroup from './components/CreateGroup';
import CreateStadium from './components/CreateStadium';
import CreateMatch from './components/CreateMatch';
import Home from './pages/Home';
import PlaceBetPage from './components/PlaceBetPage';
import GroupStandingsPage from './components/GroupStandingsPage';
import MassBets from './components/MassBets';
import ScoreboardPage from './components/ScoreBoardPage';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Recuperar datos de localStorage al montar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedMessage = localStorage.getItem('message');
    
    if (token && storedMessage) {
      setMessage(storedMessage);
      const isAdmin = storedMessage === 'Bienvenido, Admin User!';
      setUser({ isAdmin });
    }
  }, []);

  const handleLogin = (token, message) => {
    console.log('Mensaje recibido del API:', message);
    localStorage.setItem('token', token);
    localStorage.setItem('message', message);
    setMessage(message);
  
    const isAdmin = message === 'Bienvenido, Admin User!';
    setUser({ isAdmin });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('message');
    setUser(null);
    setMessage('');
  };

   // Función para controlar la apertura/cierre del sidebar
   const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      {!user ? (
        // Layout para usuarios no autenticados
        <div className="auth-container">
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      ) : (
        // Layout para usuarios autenticados (ahora responsive)
        <div className="app-container">
          {/* Overlay para cerrar sidebar en móviles */}
          {sidebarOpen && (
            <div className="sidebar-overlay d-lg-none" onClick={toggleSidebar}></div>
          )}
          
          {/* Sidebar con props para controlar visibilidad */}
          <Sidebar 
            message={message} 
            isOpen={sidebarOpen} 
            toggleSidebar={toggleSidebar} 
          />
          
          <div className="main-content">   
            {/* Header con botón para menú hamburguesa */}
            <Header 
              message={message} 
              onLogout={handleLogout} 
              toggleSidebar={toggleSidebar} 
            />
            
            {/* Contenido principal */}
            <div className="content-container">
              <Routes>
                <Route path="/home" element={<Home user={user} />} />
                <Route 
                  path="/create-team" 
                  element={
                    message === 'Bienvenido, Admin User!' 
                      ? <CreateTeam /> 
                      : <Navigate to="/home" />
                  } 
                />
                {/* Resto de rutas sin cambios... */}
                <Route 
                  path="/create-group" 
                  element={
                    message === 'Bienvenido, Admin User!' 
                      ? <CreateGroup /> 
                      : <Navigate to="/home" />
                  } 
                />
                <Route 
                  path="/create-stadium" 
                  element={
                    message === 'Bienvenido, Admin User!' 
                      ? <CreateStadium /> 
                      : <Navigate to="/home" />
                  } 
                />
                <Route 
                  path="/create-match" 
                  element={
                    message === 'Bienvenido, Admin User!' 
                      ? <CreateMatch /> 
                      : <Navigate to="/home" />
                  } 
                />
                <Route 
                  path="/mass-bets" 
                  element={
                    message === 'Bienvenido, Admin User!' 
                      ? <MassBets /> 
                      : <Navigate to="/home" />
                  } 
                />
                <Route
                  path="/bet-match" // Esta es la ruta para apostar
                  element={
                    message !== 'Bienvenido, Admin User!' && user // Solo si NO es admin y está logueado
                      ? <PlaceBetPage /> // Renderiza el componente de apuestas
                      : <Navigate to="/home" /> // Si es admin o no está logueado, redirige a home
                  }
                />
                <Route
                  path="/group-standings" // Esta es la ruta para apostar
                  element={
                    message !== 'Bienvenido, Admin User!' && user // Solo si NO es admin y está logueado
                      ? <GroupStandingsPage /> // Renderiza el componente de apuestas
                      : <Navigate to="/home" /> // Si es admin o no está logueado, redirige a home
                  }
                />
                 <Route
                  path="/scoreboard" 
                  element={
                    message !== 'Bienvenido, Admin User!' && user // Solo si NO es admin y está logueado
                      ? <ScoreboardPage /> // Renderiza el componente de apuestas
                      : <Navigate to="/home" /> // Si es admin o no está logueado, redirige a home
                  }
                />                 
                <Route path="*" element={<Navigate to="/home" />} />
              </Routes>
            </div>
            
            {/* Footer */}
            <Footer />
          </div>
        </div>
      )}
    </Router>
  );
}