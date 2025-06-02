import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import API from '../api'; // Asegúrate de que esta instancia esté configurada correctamente

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // The API response structure is:
      // {
      //     "message": "Bienvenido, Admin User!",
      //     "user": {
      //         "id": 9,
      //         "name": "Admin User",
      //         // ... other user details
      //     },
      //     "token": "..."
      // }
      const response = await API.post('/login', { email, password });
      const { token, user, message } = response.data; // Destructure 'user' object directly

      console.log('Respuesta del API:', response.data); // Depuración

      // --- THE CRUCIAL CHANGE IS HERE ---
      // 1. Save the token to localStorage
      localStorage.setItem('token', token);

      // 2. Extract and save the user ID from the 'user' object
      if (user && user.id) { // Check if 'user' object and its 'id' property exist
        localStorage.setItem('userId', user.id);
        console.log('User ID guardado:', user.id); // Depuración
      } else {
        // Handle case where user data or ID is missing in the response
        console.warn("User ID not found in login response. Betting functionality may be affected.");
        setError("Error al obtener el ID de usuario. Por favor, intenta iniciar sesión de nuevo.");
        // Optionally, prevent further action if userId is critical
        return;
      }
      // --- END CRUCIAL CHANGE ---

      // If you still need to call onLogin for other global state updates, keep it.
      if (onLogin) {
        onLogin(token, message);
      }

      console.log('Redirigiendo al Home...');
      navigate('/home'); // Redirect to Home after login

    } catch (err) {
      setError(err.response?.data?.message || 'Error en autenticación');
      console.error("Login error:", err);
    }
  };

  return (
    <Container>
      <Row className="justify-content-md-center mt-5">
        <Col md={6}>
          <h2 className="mb-4 text-primary">Iniciar Sesión</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>Correo electrónico</Form.Label>
              <Form.Control
                type="email"
                placeholder="Ingresa tu correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
              Entrar
            </Button>
          </Form>
          <div className="mt-3 text-center">
            <a href="/forgot-password">¿Olvidaste tu contraseña?</a> | <a href="/register">Registrarse</a>
          </div>
        </Col>
      </Row>
    </Container>
  );
}