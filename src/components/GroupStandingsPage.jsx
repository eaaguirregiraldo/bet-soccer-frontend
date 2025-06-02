import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Container, Row, Col, Card, Table, Spinner, Badge } from 'react-bootstrap';
import API from '../api';

export default function CreateGroup() {
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState('');
  const [teams, setTeams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  
  // Opciones para los grupos
  const groupOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  // Cargar equipos disponibles al montar el componente
  useEffect(() => {
    console.log("useEffect: Component mounted");
    loadTeams();
    loadGroups();
  }, []);

  // Cargar la lista de equipos disponibles
  const loadTeams = async () => {
    try {
      setLoading(true);
      console.log("loadTeams: Fetching teams...");
      const response = await API.get('/teams');
      console.log("loadTeams: Response received", response);
      if (Array.isArray(response.data)) {
        setTeams(response.data);
        console.log("loadTeams: Teams set successfully");
      } else if (response.data.data) {
        setTeams(response.data.data);
        console.log("loadTeams: Teams set successfully (from .data.data)");
      }
    } catch (error) {
      console.error('loadTeams: Error al cargar equipos:', error);
      setError('Error al cargar la lista de equipos');
    } finally {
      setLoading(false);
      console.log("loadTeams: setLoading to false");
    }
  };

  // Función para ordenar los equipos dentro de un grupo
const sortTeamsByStats = (teams) => {
    return [...teams].sort((a, b) => {
      // 1. Ordenar por puntos (descendente)
      if (b.Points !== a.Points) {
        return b.Points - a.Points;
      }
      // 2. Si hay empate en puntos, ordenar por diferencia de goles (descendente)
      if (b.DG !== a.DG) {
        return b.DG - a.DG;
      }
      // 3. Si hay empate en diferencia de goles, ordenar por goles a favor (descendente)
      if (b.GF !== a.GF) {
        return b.GF - a.GF;
      }
      // 4. Si hay empate en goles a favor, ordenar por partidos ganados (descendente)
      return b.PG - a.PG;
    });
  };
  
  // Cargar los grupos existentes
  const loadGroups = async () => {
    try {
      setLoadingGroups(true);
      console.log("loadGroups: Fetching groups...");
      const response = await API.get('/groups');
      console.log("loadGroups: Response received", response);
      
      // Determinar la fuente de datos correcta
      const data = Array.isArray(response.data) ? response.data : response.data.data;
      console.log("loadGroups: Data", data);
      
      if (data) {
        // Organizamos los grupos por su descripción (letra)
        const groupsByLetter = data.reduce((acc, group) => {
          if (!acc[group.description]) {
            acc[group.description] = [];
          }
          acc[group.description].push(group);
          return acc;
        }, {});
        console.log("loadGroups: Groups by letter", groupsByLetter);
        
        // Ordenar los equipos dentro de cada grupo
        Object.keys(groupsByLetter).forEach(letter => {
          groupsByLetter[letter] = sortTeamsByStats(groupsByLetter[letter]);
        });
        console.log("loadGroups: Sorted groups by letter", groupsByLetter);
        
        setGroups(groupsByLetter);
        console.log("loadGroups: Groups set successfully");
      }
    } catch (error) {
      console.error('loadGroups: Error al cargar grupos:', error);
      setError('Error al cargar la lista de grupos');
    } finally {
      setLoadingGroups(false);
      console.log("loadGroups: setLoadingGroups to false");
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    console.log("handleSubmit: Form submitted");

    if (!description || !teamId) {
      setError('Por favor seleccione un grupo y un equipo');
      console.log("handleSubmit: Description or TeamId missing");
      return;
    }

    try {
      // Realizar la solicitud al backend
      console.log("handleSubmit: Attempting to create group", { description, id_team: teamId });
      await API.post('/groups', {
        description,
        id_team: teamId,
        GF: 0,
        GC: 0,
        DG: 0,
        Points: 0,
        PJ: 0,
        PG: 0,
        PP: 0
      });

      // Mostrar mensaje de éxito y limpiar el formulario
      setSuccess('Equipo asignado al grupo exitosamente');
      console.log("handleSubmit: Group created successfully");
      setDescription('');
      setTeamId('');
      
      // Recargar los grupos para mostrar el cambio
      await loadGroups();
    } catch (err) {
      // Verificar si es un error de equipo ya asignado
      if (err.response?.status === 422) {
        setError('Este equipo ya está asignado a un grupo');
        console.log("handleSubmit: Team already assigned to a group");
      } else {
        setError(err.response?.data?.message || 'Error al crear el grupo');
        console.error("handleSubmit: Error creating group", err);
      }
    }
  };

  // Función para verificar si una cadena es una imagen base64 válida
  const isValidBase64Image = (str) => {
    if (!str) return false;
    try {
      return str.startsWith('data:image/');
    } catch (e) {
      return false;
    }
  };

  // Función para obtener el equipo a partir de su ID
  const getTeamById = (id) => {
    return teams.find(team => team.id === id);
  };

  return (
    <Container fluid> {/* Cambiado de Container a Container fluid para más ancho */}
      <Row className="justify-content-md-center mt-4">
        <Col md={10}>
          <h2 className="mb-4 text-primary">Crear Grupos</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formGroup">
                  <Form.Label>Grupo</Form.Label>
                  <Form.Select
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  >
                    <option value="">Seleccione un grupo</option>
                    {groupOptions.map(group => (
                      <option key={group} value={group}>Grupo {group}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formTeam">
                  <Form.Label>Equipo</Form.Label>
                  {loading ? (
                    <div className="text-center">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : (
                    <Form.Select
                      value={teamId}
                      onChange={(e) => setTeamId(parseInt(e.target.value))}
                      required
                    >
                      <option value="">Seleccione un equipo</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>
            </Row>
            
            {/* Vista previa del equipo seleccionado */}
            {teamId && (
              <div className="mb-3 p-3 border rounded">
                <h5>Equipo seleccionado:</h5>
                <div className="d-flex align-items-center">
                  {isValidBase64Image(getTeamById(parseInt(teamId))?.team_shield) ? (
                    <img 
                      src={getTeamById(parseInt(teamId)).team_shield} 
                      alt={`Logo de ${getTeamById(parseInt(teamId)).name}`}
                      style={{ height: '60px', width: '60px', objectFit: 'contain' }}
                      className="me-3"
                    />
                  ) : (
                    <div className="bg-light me-3" style={{ height: '60px', width: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span>Sin logo</span>
                    </div>
                  )}
                  <h4>{getTeamById(parseInt(teamId))?.name}</h4>
                </div>
              </div>
            )}

            <Button variant="primary" type="submit" className="w-100 mt-3">
              Asignar Equipo al Grupo
            </Button>
          </Form>
        </Col>
      </Row>
      
      {/* Visualización de grupos existentes */}
      <Row className="mt-5">
      <Col md={11} className="mx-auto"> {/* Ampliado y centrado */}
        <h3 className="mb-4">Grupos Actuales</h3>
        
        {loadingGroups ? (
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Cargando grupos...</span>
            </Spinner>
          </div>
        ) : (
          <Row>
            {Object.keys(groups).length > 0 ? (
              Object.entries(groups).map(([letter, groupTeams]) => (
                <Col md={6} xl={4} className="mb-4" key={letter}> {/* Cambiado lg={4} a xl={4} para más espacio */}
                  <Card>
                    <Card.Header className="bg-primary text-white">
                      <h4 className="mb-0">Grupo {letter}</h4>
                    </Card.Header>
                    <Card.Body className="p-2"> {/* Reducido padding para aprovechar espacio */}
                      <Table striped bordered hover responsive>
                        <thead>
                          <tr className="text-center">
                            <th style={{ width: '40%' }}>Equipo</th> {/* Definido ancho explícito del 40% */}
                            <th>PJ</th>
                            <th>PG</th>
                            <th>PP</th>
                            <th>GF</th>
                            <th>GC</th>
                            <th>DG</th>
                            <th style={{ minWidth: '50px' }}>Pts</th> {/* Definido ancho mínimo para puntos */}
                          </tr>
                        </thead>
                        <tbody>
                          {groupTeams.map((groupTeam) => {
                            const team = getTeamById(groupTeam.id_team);
                            return (
                              <tr key={groupTeam.id} className="text-center">
                                <td className="text-start" style={{ maxWidth: '180px' }}> {/* Ancho máximo definido */}
                                  <div className="d-flex align-items-center">
                                    {isValidBase64Image(team?.team_shield) ? (
                                      <img 
                                        src={team.team_shield} 
                                        alt={`Logo de ${team.name}`}
                                        style={{ height: '30px', width: '30px', objectFit: 'contain', flexShrink: 0 }}
                                        className="me-2"
                                      />
                                    ) : null}
                                    <span 
                                      title={team?.name || 'Equipo desconocido'} 
                                      className="text-truncate d-inline-block"
                                      style={{ maxWidth: '120px' }} // Ancho máximo para el nombre
                                    >
                                      {team?.name || 'Desconocido'}
                                    </span>
                                  </div>
                                </td>
                                <td>{groupTeam.PJ}</td>
                                <td>{groupTeam.PG}</td>
                                <td>{groupTeam.PP}</td>
                                <td>{groupTeam.GF}</td>
                                <td>{groupTeam.GC}</td>
                                <td>{groupTeam.DG}</td>
                                <td>
                                  <Badge bg="success" pill>
                                    {groupTeam.Points}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col>
                <Alert variant="info">
                  No hay grupos creados. Asigne equipos a los grupos usando el formulario.
                </Alert>
              </Col>
            )}
          </Row>
        )}
      </Col>
    </Row>
  </Container>
);
}