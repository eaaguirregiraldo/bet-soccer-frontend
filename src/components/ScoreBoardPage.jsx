import React, { useState, useEffect } from 'react';
import { Container, Table, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

export default function ScoreboardPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Set current user ID from localStorage
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setCurrentUser(parseInt(storedUserId));
    }

    // Fetch scoreboard data
    const fetchScoreboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError("Necesitas iniciar sesión para ver el ranking.");
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`${API_BASE_URL}/scoreboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Detectar formato de respuesta y adaptarse
        let userData = [];
        if (Array.isArray(response.data)) {
          // Si la respuesta es directamente un array
          userData = response.data;
        } else if (response.data && response.data.data) {
          // Si la respuesta tiene un formato anidado
          userData = response.data.data;
        } else {
          console.error("Formato de respuesta inesperado:", response.data);
          setError("Formato de respuesta del servidor no reconocido.");
          setLoading(false);
          return;
        }

        // Asegurar que todos los usuarios tengan total_points como número
        userData = userData.map(user => ({
          ...user,
          total_points: user.total_points === null ? 0 : Number(user.total_points)
        }));

        // Ordenar por puntos (de mayor a menor)
        userData.sort((a, b) => b.total_points - a.total_points);
        
        setUsers(userData);
      } catch (err) {
        console.error("Error al cargar tabla de posiciones:", err);
        setError(err.response?.data?.message || 'Error al cargar el ranking de usuarios.');
      } finally {
        setLoading(false);
      }
    };

    fetchScoreboard();
  }, []);

  // Get the user position based on total points
  const getUserPosition = (userId) => {
    const index = users.findIndex(user => user.id === userId);
    return index !== -1 ? index + 1 : null;
  };

  const currentUserPosition = currentUser ? getUserPosition(currentUser) : null;

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Cargando tabla de posiciones...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4 text-center">Tabla de Posiciones</h1>
      
      {currentUserPosition && (
        <Alert variant="info" className="mb-4">
          <strong>Tu posición actual: </strong> 
          <Badge bg="primary" className="ms-2">{currentUserPosition}° lugar</Badge> 
          con <Badge bg="success">{users.find(user => user.id === currentUser)?.total_points || 0}</Badge> puntos
        </Alert>
      )}

      <Row className="mb-3">
        <Col>
          {users.length === 0 ? (
            <Alert variant="info">No hay datos de puntajes disponibles.</Alert>
          ) : (
            <Table striped bordered hover responsive className="align-middle">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="text-center">#</th>
                  <th>Usuario</th>
                  <th className="text-center">Correo</th>
                  <th className="text-center">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className={currentUser === user.id ? 'table-primary' : ''}
                  >
                    <td className="text-center">
                      {index === 0 ? (
                        <span className="badge rounded-pill bg-warning text-dark">🥇 1</span>
                      ) : index === 1 ? (
                        <span className="badge rounded-pill bg-secondary">🥈 2</span>
                      ) : index === 2 ? (
                        <span className="badge rounded-pill bg-danger">🥉 3</span>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </td>
                    <td>
                      {user.name}
                      {currentUser === user.id && (
                        <Badge bg="info" className="ms-2">Tú</Badge>
                      )}
                    </td>
                    <td className="text-center">{user.email}</td>
                    <td className="text-center">
                      <Badge bg="success" pill style={{ fontSize: '1em' }}>
                        {user.total_points}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Col>
      </Row>
      
      {users.length > 0 && (
        <div className="text-center text-muted mt-4">
          <small>Última actualización: {new Date().toLocaleString()}</small>
        </div>
      )}
    </Container>
  );
}