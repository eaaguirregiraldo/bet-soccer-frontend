import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Container, Row, Col, Card, Spinner, Modal, Table, Pagination } from 'react-bootstrap';
import API from '../api';

export default function CreateMatch() {
  // Estados para el formulario de partido
  const [idTeam1, setIdTeam1] = useState('');
  const [idTeam2, setIdTeam2] = useState('');
  const [idStadium, setIdStadium] = useState(''); // Nuevo estado para estadio
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  
  // Estados para el listado y paginación
  const [allMatches, setAllMatches] = useState([]);  // Todos los partidos
  const [displayedMatches, setDisplayedMatches] = useState([]);  // Partidos para mostrar en la página actual
  const [teams, setTeams] = useState([]);
  const [stadiums, setStadiums] = useState([]); // Nuevo estado para lista de estadios
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingStadiums, setLoadingStadiums] = useState(false); // Estado para carga de estadios
  const matchesPerPage = 10;
  
  // Estados para mensajes y errores
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Estado para el modal de actualización
  const [showModal, setShowModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [originalProcesado, setOriginalProcesado] = useState(null); // Nuevo estado para rastrear el valor original
  const [scoreTeam1, setScoreTeam1] = useState('');
  const [scoreTeam2, setScoreTeam2] = useState('');
  const [editMatchDate, setEditMatchDate] = useState(''); // Nuevo estado para editar fecha
  const [editMatchTime, setEditMatchTime] = useState(''); // Nuevo estado para editar hora
  const [editStadiumId, setEditStadiumId] = useState(''); // Nuevo estado para editar estadio
  const [updatingScore, setUpdatingScore] = useState(false);
  const [processingStats, setProcessingStats] = useState(false);
  const [updatingPoints, setUpdatingPoints] = useState(false);

  // Primero cargar equipos y estadios
  useEffect(() => {
    loadTeams();
    loadStadiums(); // Cargar estadios al iniciar
  }, []);

  // Después de cargar los equipos, cargar los partidos
  useEffect(() => {
    if (teams.length > 0 && stadiums.length > 0) {
      loadAllMatches();
    }
  }, [teams, stadiums]);

  // Cargar la lista de equipos
  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await API.get('/teams');
      
      if (Array.isArray(response.data)) {
        setTeams(response.data);
      } else if (response.data.data) {
        setTeams(response.data.data);
      }
      console.log('Equipos cargados exitosamente:', response.data.length || response.data.data?.length || 0);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      setError('Error al cargar la lista de equipos');
    } finally {
      setLoading(false);
    }
  };

  // Cargar la lista de estadios
  const loadStadiums = async () => {
    try {
      setLoadingStadiums(true);
      const response = await API.get('/stadiums');
      
      if (Array.isArray(response.data)) {
        setStadiums(response.data);
      } else if (response.data.data) {
        setStadiums(response.data.data);
      }
      console.log('Estadios cargados exitosamente:', response.data.length || response.data.data?.length || 0);
    } catch (error) {
      console.error('Error al cargar estadios:', error);
      setError('Error al cargar la lista de estadios');
    } finally {
      setLoadingStadiums(false);
    }
  };

  // Cargar todos los partidos de una vez
  const loadAllMatches = async () => {
    try {
      setLoadingMatches(true);
      const response = await API.get('/schedule_results');
      
      let matchesList = [];
      
      if (Array.isArray(response.data)) {
        matchesList = response.data;
      } else if (response.data.data) {
        matchesList = response.data.data;
      }
      
      console.log('Partidos obtenidos del servidor:', matchesList.length);
      console.log('Equipos disponibles para enriquecer:', teams.length);
      console.log('Estadios disponibles para enriquecer:', stadiums.length);
      
      // Enriquecer los datos con información de los equipos y estadios
      const enrichedMatches = matchesList.map(match => {
        const team1 = teams.find(team => team.id === match.id_team_1);
        const team2 = teams.find(team => team.id === match.id_team_2);
        const stadium = stadiums.find(stadium => stadium.id === match.id_stadium);
        
        if (!team1 || !team2) {
          console.log('No se encontró equipo:', !team1 ? `ID equipo 1: ${match.id_team_1}` : `ID equipo 2: ${match.id_team_2}`);
        }
        
        if (!stadium) {
          console.log('No se encontró estadio:', `ID estadio: ${match.id_stadium}`);
        }
        
        return {
          ...match,
          team1: team1 || { name: 'Equipo desconocido', team_shield: null },
          team2: team2 || { name: 'Equipo desconocido', team_shield: null },
          stadium: stadium || { name: 'Estadio desconocido' }
        };
      });
      
      console.log('Partidos enriquecidos:', enrichedMatches.length);
      
      // Guardar todos los partidos
      setAllMatches(enrichedMatches);
      
      // Calcular el total de páginas
      const total = Math.ceil(enrichedMatches.length / matchesPerPage);
      setTotalPages(total || 1);
      
      // Mostrar la primera página
      updateDisplayedMatches(1, enrichedMatches);
      
    } catch (error) {
      console.error('Error al cargar partidos:', error);
      setError('Error al cargar la lista de partidos');
    } finally {
      setLoadingMatches(false);
    }
  };

  // Actualizar los partidos mostrados según la página seleccionada
  const updateDisplayedMatches = (page, matchesArray = allMatches) => {
    const startIndex = (page - 1) * matchesPerPage;
    const endIndex = startIndex + matchesPerPage;
    const paginatedMatches = matchesArray.slice(startIndex, endIndex);
    
    setDisplayedMatches(paginatedMatches);
    setCurrentPage(page);
    
    console.log(`Mostrando partidos ${startIndex + 1}-${Math.min(endIndex, matchesArray.length)} de ${matchesArray.length}`);
  };

  // Manejar cambio de página
  const handlePageChange = (page) => {
    window.scrollTo(0, 0); // Volver al inicio de la página
    updateDisplayedMatches(page);
  };

  // Manejar el envío del formulario para crear partido
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validaciones
    if (idTeam1 === idTeam2) {
      setError('No se puede crear un partido con el mismo equipo');
      return;
    }

    if (!matchDate || !matchTime || !idStadium) {
      setError('La fecha, hora y estadio son obligatorios');
      return;
    }

    try {
      setLoading(true);
            
      // Combinar fecha y hora para crear un objeto DateTime con el formato correcto Y-m-d H:i:s
      const dateTime = `${matchDate} ${matchTime}:00`;
      
      // Crear el partido con el nuevo campo procesado=0 (false)
      await API.post('/schedule_results', {
        id_team_1: idTeam1,
        id_team_2: idTeam2,
        id_stadium: idStadium, // Usar el estadio seleccionado
        date_time: dateTime,
        score_team1: null,
        score_team2: null,
        procesado: 0 // Usando 0 como valor numérico para false
      });

      // Mostrar mensaje de éxito y limpiar el formulario
      setSuccess('Partido creado exitosamente');
      setIdTeam1('');
      setIdTeam2('');
      setIdStadium('');
      setMatchDate('');
      setMatchTime('');
      
      // Recargar la lista de partidos
      await loadAllMatches();
      
    } catch (err) {
      console.error('Error al crear partido:', err);
      setError(err.response?.data?.message || 'Error al crear el partido');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para actualizar resultado
  const handleShowUpdateModal = (match) => {
    setSelectedMatch(match);
    // Guardamos el valor original de procesado cuando abrimos el modal
    setOriginalProcesado(match.procesado);
    console.log("Modal abierto - ID:", match.id, "Procesado original:", match.procesado);
    
    setScoreTeam1(match.score_team1 !== null ? match.score_team1.toString() : '');
    setScoreTeam2(match.score_team2 !== null ? match.score_team2.toString() : '');
    
    // Extraer fecha y hora del partido
    const dateTime = new Date(match.date_time);
    const formattedDate = dateTime.toISOString().split('T')[0];
    const hours = String(dateTime.getHours()).padStart(2, '0');
    const minutes = String(dateTime.getMinutes()).padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;
    
    setEditMatchDate(formattedDate);
    setEditMatchTime(formattedTime);
    setEditStadiumId(match.id_stadium);
    
    setShowModal(true);
  };

  // Función modificada para actualizar estadísticas de grupo y puntos de las apuestas
  const handleUpdateGroupStats = async (match) => {
    try {
      setProcessingStats(true);
      setUpdatingPoints(true);
      setError(null);
      setSuccess(null);
      
      // Verificar que el partido tenga resultados
      if (match.score_team1 === null || match.score_team2 === null) {
        setError('El partido debe tener un resultado antes de procesar estadísticas');
        return;
      }

      console.log("Procesando estadísticas para partido ID:", match.id);
      
      // 1. Enviar petición al servidor para procesar las estadísticas
      await API.post(`/group-statistics/${match.id}/update`);
      console.log("Estadísticas de grupo procesadas correctamente para partido ID:", match.id);
      
      // 2. Actualizar los puntos de las apuestas relacionadas con este partido
      console.log("Actualizando puntos de apuestas para partido ID:", match.id);
      const pointsResponse = await API.post(`/matches/${match.id}/update-points`);
      console.log("Puntos actualizados:", pointsResponse.data);
      
      // 3. Actualizar el estado del partido a procesado=1 después de procesar todo
      await API.put(`/schedule_results/${match.id}`, {
        procesado: 1
      });
      
      setSuccess('Estadísticas de grupo y puntos de apuestas procesados correctamente');
      
      // Recargar la lista de partidos para reflejar los cambios
      await loadAllMatches();
      
    } catch (err) {
      console.error('Error al procesar estadísticas o puntos:', err);
      setError(err.response?.data?.message || 'Error al procesar estadísticas y puntos');
    } finally {
      setProcessingStats(false);
      setUpdatingPoints(false);
    }
  };
  
  // Modificar la función handleUpdateScore para incluir la actualización de fecha, hora y estadio
  const handleUpdateScore = async () => {
    try {
      setUpdatingScore(true);
      setError(null);
      setSuccess(null);
  
      console.log("Actualizando resultado - ID:", selectedMatch.id);
      console.log("Estado original procesado:", originalProcesado);
      console.log("Estado actual procesado:", selectedMatch.procesado);
  
      // Verificar si se está cambiando de procesado=1 a procesado=0
      const needsReversion = originalProcesado === 1 && selectedMatch.procesado === 0;
      
      console.log("¿Necesita revertir estadísticas?", needsReversion);
  
      if (needsReversion) {
        console.log("Revirtiendo estadísticas para partido ID:", selectedMatch.id);
        // Primero revertir las estadísticas antes de actualizar el resultado
        await API.post(`/group-statistics/${selectedMatch.id}/revert`);        
        console.log('Estadísticas revertidas correctamente');
      }
      
      // Construir la nueva fecha y hora formateada
      const newDateTime = `${editMatchDate} ${editMatchTime}:00`;
  
      // Actualizar el resultado y la información del partido
      const response = await API.put(`/schedule_results/${selectedMatch.id}`, {
        score_team1: scoreTeam1,
        score_team2: scoreTeam2,
        procesado: selectedMatch.procesado,
        date_time: newDateTime,
        id_stadium: editStadiumId
      });
  
      console.log("Partido actualizado:", {
        score_team1: scoreTeam1,
        score_team2: scoreTeam2,
        date_time: newDateTime,
        id_stadium: editStadiumId
      });
      
      setSuccess('Partido actualizado correctamente');
      setShowModal(false);
      
      // Recargar la lista de partidos para reflejar los cambios
      await loadAllMatches();
      
    } catch (err) {
      console.error('Error al actualizar partido:', err);
      setError(err.response?.data?.message || 'Error al actualizar el partido');
    } finally {
      setUpdatingScore(false);
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

  // Función para formatear fecha y hora
  const formatDateTime = (dateTimeStr) => {
    try {
      const dt = new Date(dateTimeStr);
      return {
        date: dt.toLocaleDateString(),
        time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } catch (e) {
      return { date: 'Fecha inválida', time: 'Hora inválida' };
    }
  };

  // Renderizar controles de paginación
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
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

    // Determinamos qué números de página mostrar
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Ajustamos si estamos cerca del final
    if (endPage - startPage < 4 && startPage > 1) {
      startPage = Math.max(1, endPage - 4);
    }

    // Páginas numéricas
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
        disabled={currentPage === totalPages}
      />
    );

    // Botón para ir a la última página
    items.push(
      <Pagination.Last 
        key="last" 
        onClick={() => handlePageChange(totalPages)} 
        disabled={currentPage === totalPages}
      />
    );

    return <Pagination className="justify-content-center mt-3">{items}</Pagination>;
  };

  // Obtener la fecha actual en formato yyyy-mm-dd para el valor mínimo del input date
  const today = new Date().toISOString().split('T')[0];

  return (
    <Container fluid>
      <Row className="justify-content-md-center mt-4">
        <Col md={10}>
          <h2 className="mb-4 text-primary">Crear Partido</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formTeam1">
                  <Form.Label>Equipo Local</Form.Label>
                  {loading ? (
                    <div className="text-center">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : (
                    <Form.Select
                      value={idTeam1}
                      onChange={(e) => setIdTeam1(parseInt(e.target.value))}
                      required
                    >
                      <option value="">Seleccione el equipo local</option>
                      {teams.map(team => (
                        <option key={`team1-${team.id}`} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formTeam2">
                  <Form.Label>Equipo Visitante</Form.Label>
                  {loading ? (
                    <div className="text-center">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : (
                    <Form.Select
                      value={idTeam2}
                      onChange={(e) => setIdTeam2(parseInt(e.target.value))}
                      required
                      disabled={!idTeam1}
                    >
                      <option value="">Seleccione el equipo visitante</option>
                      {teams
                        .filter(team => team.id !== parseInt(idTeam1))
                        .map(team => (
                          <option key={`team2-${team.id}`} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>
            </Row>
            
            {/* Vista previa de equipos seleccionados */}
            {idTeam1 && idTeam2 && (
              <Row className="mb-4">
                <Col className="text-center">
                  <div className="d-flex justify-content-center align-items-center">
                    <div className="text-center">
                      {isValidBase64Image(teams.find(t => t.id === parseInt(idTeam1))?.team_shield) ? (
                        <img 
                          src={teams.find(t => t.id === parseInt(idTeam1)).team_shield} 
                          alt={`Logo de ${teams.find(t => t.id === parseInt(idTeam1)).name}`}
                          style={{ height: '80px', width: '80px', objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="bg-light" style={{height: '80px', width: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          <span>Sin logo</span>
                        </div>
                      )}
                      <p className="mt-2 mb-0">{teams.find(t => t.id === parseInt(idTeam1))?.name}</p>
                    </div>

                    <div className="mx-4">
                      <h2>VS</h2>
                    </div>

                    <div className="text-center">
                      {isValidBase64Image(teams.find(t => t.id === parseInt(idTeam2))?.team_shield) ? (
                        <img 
                          src={teams.find(t => t.id === parseInt(idTeam2)).team_shield} 
                          alt={`Logo de ${teams.find(t => t.id === parseInt(idTeam2)).name}`}
                          style={{ height: '80px', width: '80px', objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="bg-light" style={{height: '80px', width: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          <span>Sin logo</span>
                        </div>
                      )}
                      <p className="mt-2 mb-0">{teams.find(t => t.id === parseInt(idTeam2))?.name}</p>
                    </div>
                  </div>
                </Col>
              </Row>
            )}
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="formDate">
                  <Form.Label>Fecha del Partido</Form.Label>
                  <Form.Control
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    min={today}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3" controlId="formTime">
                  <Form.Label>Hora del Partido (formato 24 horas)</Form.Label>
                  <Form.Control
                    type="time"
                    value={matchTime}
                    onChange={(e) => setMatchTime(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3" controlId="formStadium">
                  <Form.Label>Estadio</Form.Label>
                  {loadingStadiums ? (
                    <div className="text-center">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : (
                    <Form.Select
                      value={idStadium}
                      onChange={(e) => setIdStadium(parseInt(e.target.value))}
                      required
                    >
                      <option value="">Seleccione el estadio</option>
                      {stadiums.map(stadium => (
                        <option key={`stadium-${stadium.id}`} value={stadium.id}>
                          {stadium.name}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mt-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Creando...
                </>
              ) : (
                'Crear Partido'
              )}
            </Button>
          </Form>
        </Col>
      </Row>
      
      {/* Lista de partidos */}
      <Row className="mt-5">
        <Col md={11} className="mx-auto">
          <h3 className="mb-4">Partidos Programados</h3>
          
          {/* Información de paginación */}
          {allMatches.length > 0 && (
            <p className="text-muted text-center mb-3">
              Mostrando {(currentPage - 1) * matchesPerPage + 1} - {Math.min(currentPage * matchesPerPage, allMatches.length)} de {allMatches.length} partidos
            </p>
          )}
          
          {loadingMatches ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando partidos...</span>
              </Spinner>
            </div>
          ) : (
            <>
              {displayedMatches.length > 0 ? (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr className="text-center">
                        <th>Equipo Local</th>
                        <th>Resultado</th>
                        <th>Equipo Visitante</th>
                        <th>Estadio</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedMatches.map(match => {
                        const { date, time } = formatDateTime(match.date_time);
                        return (
                          <tr key={match.id} className="align-middle">
                            <td className="text-center">
                              <div className="d-flex flex-column align-items-center">
                                {isValidBase64Image(match.team1?.team_shield) ? (
                                  <img 
                                    src={match.team1.team_shield} 
                                    alt={`Logo de ${match.team1.name}`}
                                    style={{ height: '50px', width: '50px', objectFit: 'contain' }}
                                  />
                                ) : (
                                  <div className="bg-light mb-2" style={{height: '50px', width: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    <span>Sin logo</span>
                                  </div>
                                )}
                                <span>{match.team1?.name}</span>
                              </div>
                            </td>
                            <td className="text-center">
                              <h4>
                                <span className={match.score_team1 > match.score_team2 ? 'text-success' : ''}>
                                  {match.score_team1 !== null ? match.score_team1 : '-'}
                                </span>
                                {' - '}
                                <span className={match.score_team1 < match.score_team2 ? 'text-success' : ''}>
                                  {match.score_team2 !== null ? match.score_team2 : '-'}
                                </span>
                              </h4>
                              {match.procesado === 1 && (
                                <div className="mt-1">
                                  <small className="text-success">
                                    <i className="bi bi-check-circle-fill me-1"></i>
                                    Procesado
                                  </small>
                                </div>
                              )}
                            </td>
                            <td className="text-center">
                              <div className="d-flex flex-column align-items-center">
                                {isValidBase64Image(match.team2?.team_shield) ? (
                                  <img 
                                    src={match.team2.team_shield} 
                                    alt={`Logo de ${match.team2.name}`}
                                    style={{ height: '50px', width: '50px', objectFit: 'contain' }}
                                  />
                                ) : (
                                  <div className="bg-light mb-2" style={{height: '50px', width: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    <span>Sin logo</span>
                                  </div>
                                )}
                                <span>{match.team2?.name}</span>
                              </div>
                            </td>
                            <td className="text-center">{match.stadium?.name || "No definido"}</td>
                            <td className="text-center">{date}</td>
                            <td className="text-center">{time}</td>                            
                            <td className="text-center">
                              <div className="d-flex flex-row justify-content-center gap-2">
                                <Button 
                                  variant="outline-primary"
                                  onClick={() => handleShowUpdateModal(match)}
                                  size="sm"
                                >
                                  Actualizar
                                </Button>
                                
                                {/* Botón para procesar estadísticas y puntos */}
                                <Button
                                  variant="outline-success"
                                  onClick={() => handleUpdateGroupStats(match)}
                                  disabled={
                                    processingStats || updatingPoints || 
                                    !(match.procesado === 0 || match.procesado === false || match.procesado === '0') ||
                                    match.score_team1 === null || 
                                    match.score_team2 === null
                                  }
                                  size="sm"
                                  title={
                                    match.score_team1 === null || match.score_team2 === null 
                                      ? "El partido debe tener resultados para procesar estadísticas" 
                                      : match.procesado !== 0 
                                        ? "El partido ya ha sido procesado" 
                                        : "Procesar estadísticas y puntos del partido"
                                  }
                                >
                                  {processingStats || updatingPoints ? (
                                    <>
                                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                      Procesando...
                                    </>
                                  ) : (
                                    'Procesar Estadísticas'
                                  )}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="info">
                  No hay partidos programados. Cree el primer partido usando el formulario.
                </Alert>
              )}
              {renderPagination()}
            </>
          )}
        </Col>
      </Row>

      {/* Modal para actualizar resultado */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Actualizar Partido</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          {selectedMatch && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="text-center flex-grow-1">
                  {isValidBase64Image(selectedMatch.team1?.team_shield) ? (
                    <img 
                      src={selectedMatch.team1?.team_shield} 
                      alt={`Logo de ${selectedMatch.team1?.name}`}
                      style={{ height: '60px', width: '60px', objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="bg-light mb-2 mx-auto" style={{height: '60px', width: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <span>Sin logo</span>
                    </div>
                  )}
                  <p className="mb-0 mt-1">{selectedMatch.team1?.name}</p>
                </div>

                <div className="mx-3 text-center">
                  <h4>VS</h4>
                </div>

                <div className="text-center flex-grow-1">
                  {isValidBase64Image(selectedMatch.team2?.team_shield) ? (
                    <img 
                      src={selectedMatch.team2?.team_shield} 
                      alt={`Logo de ${selectedMatch.team2?.name}`}
                      style={{ height: '60px', width: '60px', objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="bg-light mb-2 mx-auto" style={{height: '60px', width: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <span>Sin logo</span>
                    </div>
                  )}
                  <p className="mb-0 mt-1">{selectedMatch.team2?.name}</p>
                </div>
              </div>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="editDate">
                    <Form.Label>Fecha del Partido</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={editMatchDate}
                      onChange={(e) => setEditMatchDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="editTime">
                    <Form.Label>Hora del Partido</Form.Label>
                    <Form.Control 
                      type="time" 
                      value={editMatchTime}
                      onChange={(e) => setEditMatchTime(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3" controlId="editStadium">
                <Form.Label>Estadio</Form.Label>
                <Form.Select
                  value={editStadiumId}
                  onChange={(e) => setEditStadiumId(parseInt(e.target.value))}
                  required
                >
                  <option value="">Seleccione el estadio</option>
                  {stadiums.map(stadium => (
                    <option key={`edit-stadium-${stadium.id}`} value={stadium.id}>
                      {stadium.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>{`Goles de ${selectedMatch.team1?.name}`}</Form.Label>
                    <Form.Control 
                      type="number" 
                      min="0"
                      value={scoreTeam1} 
                      onChange={(e) => setScoreTeam1(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>{`Goles de ${selectedMatch.team2?.name}`}</Form.Label>
                    <Form.Control 
                      type="number" 
                      min="0"
                      value={scoreTeam2} 
                      onChange={(e) => setScoreTeam2(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Checkbox para el campo procesado con valores 0/1 */}
              <Form.Group className="mt-3">
                <Form.Check 
                  type="checkbox" 
                  id="procesadoCheck" 
                  label="Partido procesado en estadísticas"
                  checked={selectedMatch.procesado === 1}
                  onChange={(e) => {
                    console.log("Cambiando procesado:", e.target.checked ? 1 : 0);
                    setSelectedMatch({
                      ...selectedMatch,
                      procesado: e.target.checked ? 1 : 0
                    });
                  }}
                  disabled={selectedMatch.procesado === 0 || selectedMatch.procesado === false || selectedMatch.procesado === '0'}
                />
                {selectedMatch.procesado === 1 && (
                  <Form.Text className="text-danger">
                    ¡Advertencia! Desmarcar esta opción revertirá todas las estadísticas aplicadas a los grupos.
                  </Form.Text>
                )}
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateScore}
            disabled={updatingScore}
          >
            {updatingScore ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Actualizando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}