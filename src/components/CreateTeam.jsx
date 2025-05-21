import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Container, Row, Col, Card, Pagination, Spinner } from 'react-bootstrap';
import API from '../api';
import UpdateTeam from './UpdateTeam'; // Importar el nuevo componente

export default function CreateTeam() {
  const [name, setName] = useState('');
  const [teamShield, setTeamShield] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Estados para manejar la lista de equipos y paginación
  const [teams, setTeams] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const teamsPerPage = 10;
  
  // Estado para el modal de actualización
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Cargar la lista de equipos
  const loadTeams = async (page = 1) => {
    try {
      setLoading(true);
      
      // Aseguramos que la página sea un número
      const pageNumber = parseInt(page);
      
      // Hacemos la solicitud a la API para obtener los equipos paginados
      console.log(`Solicitando página ${pageNumber}, ${teamsPerPage} equipos por página`);
      const response = await API.get(`/teams`, {
        params: {
          page: pageNumber,
          per_page: teamsPerPage
        }
      });
      
      console.log('Respuesta de la API:', response.data);
      
      // Verificamos el formato de la respuesta y extraemos los datos relevantes
      if (Array.isArray(response.data)) {
        // La API devuelve un array simple, implementamos la paginación del lado del cliente
        const allTeams = response.data;
        const total = allTeams.length;
        const startIndex = (pageNumber - 1) * teamsPerPage;
        const paginatedTeams = allTeams.slice(startIndex, startIndex + teamsPerPage);
        
        console.log(`Paginación cliente: mostrando ${paginatedTeams.length} de ${total} equipos`);
        
        setTeams(paginatedTeams);
        setTotalPages(Math.ceil(total / teamsPerPage));
        
      } else if (response.data.data) {
        // La API devuelve una estructura con paginación
        const { data, meta } = response.data;
        
        console.log(`Paginación servidor: página ${meta?.current_page || pageNumber} de ${meta?.last_page || '?'}`);
        
        setTeams(data);
        
        // Calcular el total de páginas basado en la metadata proporcionada o realizar un cálculo aproximado
        if (meta?.total && meta?.per_page) {
          setTotalPages(Math.ceil(meta.total / meta.per_page));
        } else if (response.data.total) {
          setTotalPages(Math.ceil(response.data.total / teamsPerPage));
        } else {
          // Si no hay información de paginación, asumimos que hay al menos esta página
          setTotalPages(Math.max(pageNumber, totalPages));
        }
      } else {
        // Formato de respuesta inesperado
        console.error('Formato de respuesta inesperado:', response.data);
        setTeams([]);
        setTotalPages(0);
      }
      
      // Actualizar la página actual
      setCurrentPage(pageNumber);
      
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      setError('Error al cargar la lista de equipos');
      setTeams([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Cargar equipos al montar el componente
  useEffect(() => {
    loadTeams();
  }, []);

  // Manejar la carga de la imagen y convertirla a Base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTeamShield(reader.result); // Guardar la imagen en formato base64
      };
      reader.readAsDataURL(file);
    }
  };

  // Manejar el envío del formulario para crear equipo
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Realizar la solicitud al backend
      const response = await API.post('/teams', {
        id_tournament: 1, // Siempre enviar 1 como ID del torneo
        name,
        team_shield: teamShield, // Enviar la imagen en base64
      });

      // Mostrar mensaje de éxito y limpiar el formulario
      setSuccess('Equipo creado exitosamente.');
      setName('');
      setTeamShield('');
      
      // Recargar la lista de equipos para mostrar el recién creado
      loadTeams(1); // Volver a la primera página para ver el nuevo equipo
    } catch (err) {
      // Manejar errores de la solicitud
      setError(err.response?.data?.message || 'Error al crear el equipo');
    }
  };

  // Manejar cambio de página
  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadTeams(page);
  };

  // Abrir modal para editar equipo
  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setShowUpdateModal(true);
  };

  // Manejar la actualización exitosa de un equipo
  const handleTeamUpdated = (updatedTeam) => {
    // Actualizar el equipo en la lista local
    const updatedTeams = teams.map(team => 
      team.id === updatedTeam.id ? updatedTeam : team
    );
    setTeams(updatedTeams);
    
    // Mostrar mensaje de éxito temporalmente
    setSuccess('Equipo actualizado exitosamente');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Renderizar controles de paginación
  const renderPagination = () => {
    let items = [];
    
    // Botón para ir a la primera página
    items.push(
      <Pagination.First 
        key="first" 
        onClick={() => handlePageChange(1)} 
        disabled={currentPage === 1}
      />
    );
    
    // Botón para página anterior
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(currentPage - 1)} 
        disabled={currentPage === 1}
      />
    );

    // Páginas numéricas (limitamos a mostrar 5 páginas cercanas a la actual)
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    // Botón para página siguiente
    items.push(
      <Pagination.Next 
        key="next" 
        onClick={() => handlePageChange(currentPage + 1)} 
        disabled={currentPage === totalPages || totalPages === 0}
      />
    );

    // Botón para ir a la última página
    items.push(
      <Pagination.Last 
        key="last" 
        onClick={() => handlePageChange(totalPages)} 
        disabled={currentPage === totalPages || totalPages === 0}
      />
    );

    return <Pagination className="mt-3 justify-content-center">{items}</Pagination>;
  };

  // Función para verificar si una cadena es una imagen base64 válida
  const isValidBase64Image = (str) => {
    if (!str) return false;
    try {
      // Verificamos que comience con el prefijo de data URL para imágenes
      return str.startsWith('data:image/');
    } catch (e) {
      return false;
    }
  };

  return (
    <Container>
      <Row className="justify-content-md-center mt-5">
        <Col md={6}>
          <h2 className="mb-4 text-primary">Crear Equipo</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formName">
              <Form.Label>Nombre del Equipo</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingresa el nombre del equipo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formTeamShield">
              <Form.Label>Escudo del Equipo</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                required={!teamShield}
              />
              {teamShield && (
                <div className="mt-2 text-center">
                  <p>Vista previa:</p>
                  <img 
                    src={teamShield} 
                    alt="Vista previa del escudo" 
                    style={{ maxHeight: '100px', maxWidth: '100px' }}
                  />
                </div>
              )}
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
              Crear Equipo
            </Button>
          </Form>
        </Col>
      </Row>
      
      {/* Lista de equipos */}
      <Row className="mt-5">
        <Col>
          <h3 className="mb-4">Lista de Equipos</h3>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </Spinner>
            </div>
          ) : (
            <>
              <Row>
                {teams.length > 0 ? (
                  teams.map((team) => (
                    <Col md={3} sm={6} key={team.id} className="mb-4">
                      <Card 
                        className="h-100 team-card" 
                        onClick={() => handleEditTeam(team)}
                        style={{ cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <div className="text-center pt-3" style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isValidBase64Image(team.team_shield) ? (
                            <img 
                              src={team.team_shield} 
                              alt={`Logo de ${team.name}`}
                              style={{ maxHeight: '100px', maxWidth: '100px', objectFit: 'contain' }} 
                              className="mx-auto"
                            />
                          ) : (
                            <div className="bg-light p-4 text-center">
                              <i className="bi bi-image text-muted" style={{ fontSize: '2rem' }}></i>
                              <p className="mt-2">Sin imagen</p>
                            </div>
                          )}
                        </div>
                        <Card.Body>
                          <Card.Title className="text-center">{team.name}</Card.Title>
                          <div className="text-center text-muted small">
                            <small>Haga clic para editar</small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                ) : (
                  <Col>
                    <Alert variant="info">
                      No hay equipos registrados. Crea el primer equipo usando el formulario.
                    </Alert>
                  </Col>
                )}
              </Row>
              {teams.length > 0 && renderPagination()}
            </>
          )}
        </Col>
      </Row>

      {/* Modal para actualizar equipo */}
      <UpdateTeam 
        show={showUpdateModal}
        onHide={() => setShowUpdateModal(false)}
        team={selectedTeam}
        onTeamUpdated={handleTeamUpdated}
      />
    </Container>
  );
}