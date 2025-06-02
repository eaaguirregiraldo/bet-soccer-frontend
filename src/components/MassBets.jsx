import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Alert, Table, Spinner, Pagination, Card } from 'react-bootstrap';
import API from '../api';

const MassBets = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [bets, setBets] = useState([]);
  const [totalBets, setTotalBets] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Función para crear apuestas masivamente
  const handleCreateMassBets = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log("Iniciando creación masiva de apuestas...");
      const response = await API.post('/mass-bets');
      console.log("Respuesta recibida:", response.data);

      setBets(response.data.bets);
      setTotalBets(response.data.total_bets);
      setSuccessMessage(`${response.data.total_bets} apuestas creadas exitosamente.`);
    } catch (error) {
      console.error("Error al crear apuestas masivas:", error);
      setError(error.response?.data?.message || 'Error al crear apuestas masivamente');
    } finally {
      setLoading(false);
    }
  };

  // Calcular datos para la paginación
  const indexOfLastBet = currentPage * itemsPerPage;
  const indexOfFirstBet = indexOfLastBet - itemsPerPage;
  const currentBets = bets.slice(indexOfFirstBet, indexOfLastBet);
  const totalPages = Math.ceil(bets.length / itemsPerPage);

  // Cambiar de página
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Generar elementos de paginación
  const paginationItems = [];
  for (let number = 1; number <= totalPages; number++) {
    paginationItems.push(
      <Pagination.Item 
        key={number} 
        active={number === currentPage}
        onClick={() => handlePageChange(number)}
      >
        {number}
      </Pagination.Item>
    );
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h2 className="mb-0">Crear Apuestas Masivamente</h2>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {successMessage && <Alert variant="success">{successMessage}</Alert>}
              
              <p className="mb-3">
                Esta función creará automáticamente apuestas para todos los usuarios registrados en los partidos disponibles.
              </p>
              
              <Button 
                variant="primary" 
                onClick={handleCreateMassBets} 
                disabled={loading}
                className="mb-4"
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Procesando...
                  </>
                ) : 'Crear Apuestas Masivas'}
              </Button>
              
              {bets.length > 0 && (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="mb-0">Apuestas Creadas</h4>
                    <span className="badge bg-success">Total: {totalBets}</span>
                  </div>
                  
                  <Table striped bordered hover responsive className="mb-3">
                    <thead className="table-dark">
                      <tr>
                        <th>#</th>
                        <th>Usuario ID</th>
                        <th>Partido ID</th>
                        <th>Marcador Equipo 1</th>
                        <th>Marcador Equipo 2</th>
                        <th>Fecha Creación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBets.map(bet => (
                        <tr key={bet.id}>
                          <td>{bet.id}</td>
                          <td>{bet.id_user}</td>
                          <td>{bet.id_schedule}</td>
                          <td>{bet.score_team1 !== null ? bet.score_team1 : '-'}</td>
                          <td>{bet.score_team2 !== null ? bet.score_team2 : '-'}</td>
                          <td>
                            {new Date(bet.created_at).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center">
                      <Pagination>
                        <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                        {paginationItems}
                        <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MassBets;