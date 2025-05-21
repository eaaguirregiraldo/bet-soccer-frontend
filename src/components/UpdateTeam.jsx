import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import API from '../api';

export default function UpdateTeam({ show, onHide, team, onTeamUpdated }) {
  const [name, setName] = useState('');
  const [teamShield, setTeamShield] = useState('');
  const [newShieldSelected, setNewShieldSelected] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar datos del equipo cuando cambia el equipo seleccionado
  useEffect(() => {
    if (team) {
      setName(team.name || '');
      setTeamShield(team.team_shield || '');
      setNewShieldSelected(false);
      setError(null);
      setSuccess(null);
    }
  }, [team]);

  // Manejar la carga de una nueva imagen
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTeamShield(reader.result);
        setNewShieldSelected(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Enviar actualización al servidor
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const data = { name };
      
      // Solo enviar el escudo si se seleccionó uno nuevo
      if (newShieldSelected) {
        data.team_shield = teamShield;
      }

      const response = await API.put(`/teams/${team.id}`, data);

      setSuccess('Equipo actualizado exitosamente');
      
      // Notificar al componente padre para que actualice la lista
      if (onTeamUpdated) {
        onTeamUpdated(response.data);
      }

      // Cerrar el modal después de un breve retraso
      setTimeout(() => {
        onHide();
      }, 1500);
      
    } catch (err) {
      console.error('Error al actualizar equipo:', err);
      setError(err.response?.data?.message || 'Error al actualizar el equipo');
    } finally {
      setLoading(false);
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

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Actualizar Equipo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formUpdateName">
            <Form.Label>Nombre del Equipo</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del equipo"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formUpdateShield">
            <Form.Label>Escudo del Equipo</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <Form.Text className="text-muted">
              Deja este campo vacío si no deseas cambiar el escudo.
            </Form.Text>
          </Form.Group>

          {teamShield && (
            <div className="text-center mb-3">
              <h6>Vista previa:</h6>
              {isValidBase64Image(teamShield) ? (
                <img
                  src={teamShield}
                  alt="Vista previa del escudo"
                  style={{ maxHeight: '150px', maxWidth: '150px' }}
                  className="mt-2 border p-2"
                />
              ) : (
                <div className="bg-light p-3 mt-2">Sin imagen válida</div>
              )}
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="secondary" onClick={onHide} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
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
                  Actualizando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}