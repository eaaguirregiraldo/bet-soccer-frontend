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
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');

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
        // Layout para usuarios autenticados
        <div className="app-container d-flex">
          {/* Sidebar en la parte izquierda */}
          <Sidebar message={message} />
          
          <div className="main-content d-flex flex-column flex-grow-1">   
            {/* Header en la parte superior derecha */}
            <Header message={message} onLogout={handleLogout} />
            
            {/* Contenido principal en el centro */}
            <div className="content-container flex-grow-1">
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
                {/* Añadir esta nueva ruta */}
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
                {/* Añadir esta nueva ruta */}
                <Route 
                  path="/create-match" 
                  element={
                    message === 'Bienvenido, Admin User!' 
                      ? <CreateMatch /> 
                      : <Navigate to="/home" />
                  } 
                />
                <Route path="*" element={<Navigate to="/home" />} />
              </Routes>
            </div>
            
            {/* Footer en la parte inferior derecha */}
            <Footer />
          </div>
        </div>
      )}
    </Router>
  );
}