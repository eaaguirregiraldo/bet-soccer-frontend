import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate
import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import API from '../api'; // Asegúrate de que esta instancia esté configurada correctamente

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Hook para redirigir

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await API.post('/login', { email, password });
      const { token, message } = response.data;

      console.log('Respuesta del API:', response.data); // Depuración
      onLogin(token, message); // Llama a handleLogin en App.js
      console.log('Redirigiendo al Home...');
      navigate('/home'); // Redirige al Home después del login
    } catch (err) {
      setError(err.response?.data?.message || 'Error en autenticación');
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