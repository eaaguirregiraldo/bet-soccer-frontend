import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Spinner, Image, Pagination, Modal, Table } from 'react-bootstrap';
import axios from 'axios';

// Construct base API URL from environment variable
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Utility function to check if a string is a valid Base64 image
const isValidBase64Image = (str) => {
  if (!str) return false;
  // Check if the string starts with a common image data URI prefix
  return str.startsWith('data:image/');
};

// Función para calcular la diferencia de tiempo y si se puede apostar
const canPlaceBet = (matchDateTime) => {
  const now = new Date();
  const matchDate = new Date(matchDateTime);
  const diffInMinutes = (matchDate.getTime() - now.getTime()) / (1000 * 60);
  // console.log(`Match: ${matchDateTime}, Now: ${now.toISOString()}, Diff: ${diffInMinutes.toFixed(2)} min, Allowed: ${diffInMinutes > 10}`); // DEBUG
  return diffInMinutes > 10; // Permite apostar si faltan más de 10 minutos
};

// StadiumModal component (showing all images in a grid)
function StadiumModal({ show, onHide, stadium, stadiumDetails, loadingDetails, errorDetails }) {
  if (!stadium) {
    return null; // Don't render if no stadium data
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{stadium.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>Características:</strong> {stadium.characteristics}</p>

        {loadingDetails ? (
          <div className="text-center py-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Cargando imágenes...</span>
            </Spinner>
          </div>
        ) : errorDetails ? (
          <Alert variant="danger">{errorDetails}</Alert>
        ) : stadiumDetails && stadiumDetails.images && stadiumDetails.images.length > 0 ? (
          <Row className="g-3"> {/* Use Row for grid */}
            {stadiumDetails.images.map((imgData, index) => (
              <Col xs={12} sm={6} md={4} lg={3} key={imgData.id || index}> {/* Use Col for responsive grid */}
                <div
                  style={{
                    height: '180px', // Fixed height for image containers
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8f9fa' // Light background for empty state
                  }}
                >
                  {isValidBase64Image(imgData.image) ? (
                    <img
                      src={imgData.image}
                      alt={`Stadium image ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover' // Use cover to fill the container
                      }}
                      onError={(e) => {
                        console.error(`Error al cargar imagen del estadio ${imgData.id || index}:`, e);
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = 'https://via.placeholder.com/200x180?text=Error+Imagen'; // Fallback image
                      }}
                    />
                  ) : (
                    <div className="text-muted text-center p-2">
                      Imagen no disponible o formato inválido
                    </div>
                  )}
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <Alert variant="info">Este estadio no tiene imágenes asociadas.</Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default function PlaceBetPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 10;

  // State for the stadium modal
  const [showStadiumModal, setShowStadiumModal] = useState(false);
  const [selectedStadium, setSelectedStadium] = useState(null);
  const [selectedStadiumDetails, setSelectedStadiumDetails] = useState(null);
  const [loadingStadiumDetails, setLoadingStadiumDetails] = useState(false);
  const [errorStadiumDetails, setErrorStadiumDetails] = useState(null); // Correctly defined here

  // States to manage individual bet scores
  const [betScores, setBetScores] = useState({}); // { matchId: { score1: val, score2: val }, ... }
  const [betErrors, setBetErrors] = useState({}); // { matchId: "error message", ... }
  const [betSuccesses, setBetSuccesses] = useState({}); // { matchId: "success message", ... }
  const [loadingBets, setLoadingBets] = useState({}); // { matchId: true/false, ... }

  // Initialize bet scores from fetched matches
  useEffect(() => {
    const initialScores = {};
    matches.forEach(match => {
      initialScores[match.id] = {
        score1: match.score_team1?.toString() ?? '',
        score2: match.score_team2?.toString() ?? '',
      };
    });
    setBetScores(initialScores);
  }, [matches]);

  // Handle score change for a specific match
  const handleScoreChange = (matchId, team, value) => {
    setBetScores(prevScores => ({
      ...prevScores,
      [matchId]: {
        ...prevScores[matchId],
        [`score${team}`]: value,
      },
    }));
    // Clear error/success messages for this match when user types
    setBetErrors(prev => {
      const newState = { ...prev };
      delete newState[matchId];
      return newState;
    });
    setBetSuccesses(prev => {
      const newState = { ...prev };
      delete newState[matchId];
      return newState;
    });
  };

  // This function fetches matches and bets, centralizing the logic
  const fetchMatchesAndBets = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const storedUserId = localStorage.getItem('userId');

      if (!API_BASE_URL) {
          setError("La URL del backend no está configurada. Revisa las variables de entorno.");
          setLoading(false);
          return;
      }

      if (!token) {
        setError("No se ha encontrado un token de autenticación. Debes iniciar sesión.");
        setLoading(false);
        return;
      }

      if (!storedUserId) {
        setError("No se ha encontrado el ID de usuario. Por favor, inicia sesión de nuevo.");
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }

      const parsedUserId = parseInt(storedUserId);
      if (isNaN(parsedUserId)) {
        setError("El ID de usuario no es válido. Por favor, inicia sesión de nuevo.");
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        setLoading(false);
        return;
      }
      setUserId(parsedUserId);

      const response = await axios.get(`${API_BASE_URL}/users/${parsedUserId}/bets`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetchedBets = response.data.bets;

      if (!Array.isArray(fetchedBets)) {
          console.error("La respuesta de la API no es un array de apuestas válido. Se esperaba la propiedad 'bets'.", response.data);
          setError("Formato de datos incorrecto recibido del servidor. Por favor, contacta a soporte.");
          setMatches([]);
          setLoading(false);
          return;
      }

      setMatches(fetchedBets);

    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Tu sesión ha expirado o no estás autorizado. Por favor, inicia sesión de nuevo.");
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
      } else {
        setError(err.response?.data?.message || 'Error al cargar los partidos. Inténtalo de nuevo más tarde.');
      }
      console.error("Error fetching matches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchesAndBets();
  }, []); // Run once on component mount

  const handlePlaceBet = async (matchId) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const isAllowed = canPlaceBet(match.schedule?.date_time);
    if (!isAllowed) {
      setBetErrors(prev => ({ ...prev, [matchId]: 'El tiempo para modificar esta apuesta ha vencido.' }));
      return;
    }

    // Crucial: Only allow update if a bet already exists for this match
    // If id_bet is null or undefined, it means no bet has been placed yet for this match.
    // In this scenario, we cannot "update" as per the requirement.
    /*
    if (match.id_bet === null || match.id_bet === undefined) {
      setBetErrors(prev => ({ ...prev, [matchId]: 'No hay una apuesta existente para modificar.' }));
      return;
    }
      */

    const { score1, score2 } = betScores[match.id] || { score1: '', score2: '' };

    if (score1 === '' || score2 === '') {
      setBetErrors(prev => ({ ...prev, [matchId]: 'Debes ingresar ambos marcadores para la apuesta.' }));
      return;
    }

    const s1 = parseInt(score1);
    const s2 = parseInt(score2);

    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      setBetErrors(prev => ({ ...prev, [matchId]: 'Los marcadores deben ser números enteros no negativos.' }));
      return;
    }

    setLoadingBets(prev => ({ ...prev, [matchId]: true }));
    setBetErrors(prev => {
      const newState = { ...prev };
      delete newState[matchId];
      return newState;
    });
    setBetSuccesses(prev => {
      const newState = { ...prev };
      delete newState[matchId];
      return newState;
    });

    try {
      const token = localStorage.getItem('token');
      if (!userId) {
        throw new Error("User ID is not available. Please log in again.");
      }

      const response = await axios.put(
        `${API_BASE_URL}/bets/${match.id}`, // Use id_bet for the PUT endpoint
        {
          id_user: userId,
          id_schedule: match.schedule.id,
          score_team1: s1,
          score_team2: s2,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBetSuccesses(prev => ({ ...prev, [match.id]: 'Apuesta modificada exitosamente.' }));

      // --- NEW: Reload data after successful update ---
      await fetchMatchesAndBets(); // Re-fetch all matches and bets
      // --- END NEW ---

    } catch (err) {
      setBetErrors(prev => ({ ...prev, [match.id]: err.response?.data?.message || 'Error al modificar la apuesta. Inténtalo de nuevo.' }));
      console.error("Error modifying bet:", err);
    } finally {
      setLoadingBets(prev => ({ ...prev, [match.id]: false }));
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTime).toLocaleDateString(undefined, options);
  };

  const loadStadiumDetails = async (stadiumId) => {
    setLoadingStadiumDetails(true);
    setErrorStadiumDetails(null);
    setSelectedStadiumDetails(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/stadiums/${stadiumId}/images`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let imagesData = [];
      if (Array.isArray(response.data)) {
        imagesData = response.data;
      } else if (response.data && Array.isArray(response.data.images)) {
        imagesData = response.data.images;
      }

      setSelectedStadiumDetails({ images: imagesData });

    } catch (err) {
      console.error('Error al cargar detalles del estadio:', err);
      setErrorStadiumDetails(err.response?.data?.message || 'Error al cargar las imágenes del estadio.');
      setSelectedStadiumDetails({ images: [] });
    } finally {
      setLoadingStadiumDetails(false);
    }
  };

  const handleStadiumClick = async (stadiumData) => {
    setSelectedStadium(stadiumData);
    setShowStadiumModal(true);
    await loadStadiumDetails(stadiumData.id);
  };

  const handleCloseStadiumModal = () => {
    setShowStadiumModal(false);
    setSelectedStadium(null);
    setSelectedStadiumDetails(null);
    setErrorStadiumDetails(null);
  };

  const sortMatchesByDateTime = (matchesArray) => {
    return [...matchesArray].sort((a, b) => {
      // Ordenar cronológicamente (ascendente) por fecha y hora del partido
      const dateA = new Date(a.schedule?.date_time);
      const dateB = new Date(b.schedule?.date_time);
      return dateA - dateB;
    });
  };
  


  const sortedMatches = sortMatchesByDateTime(matches);
  const indexOfLastMatch = currentPage * matchesPerPage;
  const indexOfFirstMatch = indexOfLastMatch - matchesPerPage;
  const currentMatches = sortedMatches.slice(indexOfFirstMatch, indexOfLastMatch);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(matches.length / matchesPerPage);

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Cargando partidos...</p>
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

  if (!matches.length && !loading) {
    return (
      <Container className="py-4">
        <Alert variant="info">No hay partidos disponibles para apostar en este momento.</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4 text-center">Realizar Apuestas</h1>
      <Row className="mb-3">
        <Col>
          <Table striped bordered hover responsive className="align-middle text-center">
          <thead className="bg-light">
            <tr>
              <th>Equipo Local</th>
              <th>Escudo</th>
              <th>Marcador Oficial</th>
              <th></th> {/* VS column */}
              <th>Equipo Visitante</th>
              <th>Escudo</th>
              <th>Marcador Oficial</th>
              <th>Mi Apuesta</th>
              <th>Puntos</th>
              <th>Información</th>
              <th>Acción</th>
            </tr>
          </thead>
            <tbody>
              {currentMatches.map((match) => {
                const schedule = match.schedule;
                const isBettingAllowed = canPlaceBet(schedule?.date_time);
                // Check if match.id_bet exists and is not null/undefined
                const hasExistingBet = match.id_bet !== null && match.id_bet !== undefined;
                const currentBetScores = betScores[match.id] || { score1: '', score2: '' };
                const matchError = betErrors[match.id];
                const matchSuccess = betSuccesses[match.id];
                const isLoadingBet = loadingBets[match.id];

                return (
                  <React.Fragment key={match.id}>
                    <tr>
                      {/* Team 1 Name */}
                      <td className="fw-bold">{schedule.team1.name}</td>
                      {/* Team 1 Shield */}
                      <td>
                        <Image
                          src={schedule.team1.team_shield || '/placeholder-shield.png'}
                          alt={schedule.team1.name}
                          fluid
                          style={{ maxHeight: '40px' }}
                        />
                      </td>
                      {/* Real Score Team 1 (Disabled) */}
                      <td>
                        <Form.Control
                          type="number"
                          value={schedule.score_team1?.toString() ?? ''}
                          disabled // Always disabled for real score
                          className="text-center"
                          style={{ width: '60px', margin: 'auto' }}
                        />
                      </td>
                      {/* VS Separator */}
                      <td className="fw-bold">vs</td>
                      {/* Team 2 Name */}
                      <td className="fw-bold">{schedule.team2.name}</td>
                      {/* Team 2 Shield */}
                      <td>
                        <Image
                          src={schedule.team2.team_shield || '/placeholder-shield.png'}
                          alt={schedule.team2.name}
                          fluid
                          style={{ maxHeight: '40px' }}
                        />
                      </td>
                      {/* Real Score Team 2 (Disabled) */}
                      <td>
                        <Form.Control
                          type="number"
                          value={schedule.score_team2?.toString() ?? ''}
                          disabled // Always disabled for real score
                          className="text-center"
                          style={{ width: '60px', margin: 'auto' }}
                        />
                      </td>
                      {/* User's Bet Input */}
                      <td>
                        <div className="d-flex justify-content-center align-items-center">
                          <Form.Control
                            type="number"
                            min="0"
                            value={currentBetScores.score1}
                            onChange={(e) => handleScoreChange(match.id, 1, e.target.value)}
                            // Input fields are disabled only if betting is not allowed or loading
                            disabled={!isBettingAllowed || isLoadingBet}
                            className="text-center"
                            style={{ width: '60px' }}
                          />
                          <span className="mx-1">-</span>
                          <Form.Control
                            type="number"
                            min="0"
                            value={currentBetScores.score2}
                            onChange={(e) => handleScoreChange(match.id, 2, e.target.value)}
                            // Input fields are disabled only if betting is not allowed or loading
                            disabled={!isBettingAllowed || isLoadingBet}
                            className="text-center"
                            style={{ width: '60px' }}
                          />
                        </div>
                      </td>
                      {/* Points */}
                      <td>
                        {match.points !== undefined && match.points !== null ? (
                          <span className="badge bg-info">{match.points}</span>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      {/* Date, Time, and Stadium */}
                      <td>
                        {formatDateTime(schedule.date_time)}
                        <br />
                        <span
                          className="text-primary"
                          style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => handleStadiumClick(schedule.stadium)}
                        >
                          {schedule.stadium.name}
                        </span>
                        {/* DEBUGGING AID: Display if betting is allowed and if bet exists */}
                        <div style={{ fontSize: '0.7em', color: 'gray' }}>
                          <span style={{ color: isBettingAllowed ? 'green' : 'red' }}>
                            {isBettingAllowed ? 'Tiempo Hábil' : 'Tiempo Vencido'}
                          </span>
                          {' / '}
                          <span style={{ color: hasExistingBet ? 'green' : 'red' }}>
                            {hasExistingBet ? 'Apuesta Existente' : 'Sin Apuesta'}
                          </span>
                        </div>
                      </td>
                      {/* Action Button */}
                      <td>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePlaceBet(match.id)}
                          // The button is ONLY disabled if the match is too close to start (less than 10 minutes).
                          disabled={!isBettingAllowed || isLoadingBet}
                        >
                          {isLoadingBet ? (
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                          ) : hasExistingBet ? (
                            'Modificar Apuesta' // If a bet exists, the text is "Modificar Apuesta"
                          ) : (
                            'Apostar' // If no bet exists, the text is "Apostar" (allowing a new bet)
                          )}
                        </Button>
                      </td>
                    </tr>
                    {/* Display errors/success messages below the row */}
                    {(matchError || matchSuccess) && (
                      <tr>
                        <td colSpan="11"> {/* Adjusted colspan as per the number of columns */}
                          {matchError && <Alert variant="danger" className="py-1 my-1 text-center">{matchError}</Alert>}
                          {matchSuccess && <Alert variant="success" className="py-1 my-1 text-center">{matchSuccess}</Alert>}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </Table>
        </Col>
      </Row>

      {totalPages > 1 && (
        <Row className="mt-4">
          <Col className="d-flex justify-content-center">
            <Pagination>
              <Pagination.First disabled={currentPage === 1} onClick={() => paginate(1)} />
              <Pagination.Prev disabled={currentPage === 1} onClick={() => paginate(currentPage - 1)} />
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2))
                .map((page, index, array) => {
                  const showEllipsis = array[index + 1] - page > 1;
                  return (
                    <React.Fragment key={page}>
                      <Pagination.Item
                        active={page === currentPage}
                        onClick={() => paginate(page)}
                      >
                        {page}
                      </Pagination.Item>
                      {showEllipsis && <Pagination.Ellipsis />}
                    </React.Fragment>
                  );
                })}
              <Pagination.Next disabled={currentPage === totalPages} onClick={() => paginate(currentPage + 1)} />
              <Pagination.Last disabled={currentPage === totalPages} onClick={() => paginate(totalPages)} />
            </Pagination>
          </Col>
        </Row>
      )}

      <StadiumModal
        show={showStadiumModal}
        onHide={handleCloseStadiumModal}
        stadium={selectedStadium}
        stadiumDetails={selectedStadiumDetails}
        loadingDetails={loadingStadiumDetails}
        // CORRECTED HERE: Moved the comment to its own line
        errorDetails={errorStadiumDetails}
      />
    </Container>
  );
}