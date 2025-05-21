import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Container, Row, Col, Card, Spinner, Modal } from 'react-bootstrap';
import API from '../api';

export default function CreateStadium() {
  // Estados para el formulario de estadio
  const [name, setName] = useState('');
  const [characteristics, setCharacteristics] = useState('');
  const [stadiumImages, setStadiumImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  
  // Estados para manejar la lista de estadios
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStadiums, setLoadingStadiums] = useState(false);
  
  // Estados para mensajes y errores
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Estado para el modal de imágenes
  const [showModal, setShowModal] = useState(false);
  const [selectedStadium, setSelectedStadium] = useState(null);
  const [stadiumDetails, setStadiumDetails] = useState(null);

  // Estados para la edición
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCharacteristics, setEditCharacteristics] = useState('');
  const [newStadiumImages, setNewStadiumImages] = useState([]);
  const [newPreviewImages, setNewPreviewImages] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatingStadium, setUpdatingStadium] = useState(false);


  // Cargar estadios existentes al montar el componente
  useEffect(() => {
    loadStadiums();
  }, []);

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
    } catch (error) {
      console.error('Error al cargar estadios:', error);
      setError('Error al cargar la lista de estadios');
    } finally {
      setLoadingStadiums(false);
    }
  };

  // Manejar la carga de imágenes y convertirlas a Base64
  const handleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
      // Limitar a un máximo de 5 imágenes
      const selectedFiles = files.slice(0, 5 - previewImages.length);
      
      // Generar previsualizaciones
      const newPreviewImages = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviewImages([...previewImages, ...newPreviewImages]);
      
      // Convertir imágenes a base64
      selectedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setStadiumImages(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Eliminar una imagen de la previsualización
  const removeImage = (index) => {
    const updatedPreviews = [...previewImages];
    const updatedImages = [...stadiumImages];
    
    updatedPreviews.splice(index, 1);
    updatedImages.splice(index, 1);
    
    setPreviewImages(updatedPreviews);
    setStadiumImages(updatedImages);
  };

  // Manejar el envío del formulario para crear estadio
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Primero crear el estadio
      const stadiumResponse = await API.post('/stadiums', {
        name,
        characteristics
      });

      const stadiumId = stadiumResponse.data.id;
      console.log('Estadio creado con ID:', stadiumId);

      // Obtener y mostrar tokens de autenticación para depuración
      const cookies = document.cookie.split('; ');
      const xsrfToken = cookies.find(cookie => cookie.startsWith('XSRF-TOKEN='));
      console.log('Cookies disponibles:', cookies);
      console.log('XSRF-TOKEN:', xsrfToken);
      
      // Verificar la configuración de API antes de subir imágenes
      console.log('API baseURL:', API.defaults.baseURL);
      console.log('API withCredentials:', API.defaults.withCredentials);
      console.log('API headers:', API.defaults.headers);

      // Luego subir cada imagen asociada
      for (let i = 0; i < stadiumImages.length; i++) {
        try {
          // Mostrar información de la imagen (recortada para evitar logs demasiado largos)
          const imagePreview = stadiumImages[i].substring(0, 50) + '... (recortado)';
          console.log(`Subiendo imagen ${i+1}/${stadiumImages.length}:`, imagePreview);
          
          const imageData = {
            image: stadiumImages[i],
            id_stadium: stadiumId
          };
          
          console.log(`Petición a: ${API.defaults.baseURL || ''}/associated-images`, {
            method: 'POST',
            headers: API.defaults.headers,
            datos: { ...imageData, image: '(imagen base64 recortada para log)' }
          });
          
          // Hacer la solicitud individualmente para mejor seguimiento
          const response = await API.post('/associated-images', imageData);
          console.log(`Imagen ${i+1} subida con éxito:`, response.status, response.statusText);
        } catch (imageError) {
          console.error(`Error al subir imagen ${i+1}:`, imageError);
          console.log('Código de error:', imageError.response?.status);
          console.log('Mensaje del servidor:', imageError.response?.data);
          console.log('Headers de respuesta:', imageError.response?.headers);
        }
      }

      // Mostrar mensaje de éxito y limpiar el formulario
      setSuccess('Estadio creado exitosamente');
      setName('');
      setCharacteristics('');
      setStadiumImages([]);
      setPreviewImages([]);
      
      // Recargar la lista de estadios
      loadStadiums();
    } catch (err) {
      console.error('Error al crear estadio:', err);
      setError(err.response?.data?.message || 'Error al crear el estadio');
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar detalles de un estadio (imágenes asociadas)
  const loadStadiumDetails = async (stadiumId, isEditMode = false) => {
    try {
      // Reiniciar datos antes de cargar
      setStadiumDetails(null);
      
      const response = await API.get(`/stadiums/${stadiumId}/images`);
      console.log('Respuesta API de imágenes:', response.data);
      
      // Transformar la estructura para que coincida con lo esperado en el renderizado
      if (response && response.data) {
        // Crear el formato esperado - un objeto con la propiedad 'images'
        const details = {
          images: Array.isArray(response.data) ? response.data : []
        };
        setStadiumDetails(details);
        console.log('Detalles estructurados:', details);
      }
    } catch (error) {
      console.error('Error al cargar detalles del estadio:', error);
      // Mostrar mensaje más específico
      if (error.response?.status === 403) {
        setError('No tiene permiso para ver las imágenes de este estadio');
      } else {
        setError('Error al cargar las imágenes del estadio');
      }
      setStadiumDetails({ images: [] });
    }
  };  

  // Manejar la carga de nuevas imágenes en el modo de edición
  const handleEditImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
      // Limitar el número total de imágenes (existentes + nuevas) a 5
      const currentImagesCount = stadiumDetails?.images?.length || 0;
      const availableSlots = 5 - currentImagesCount + removedImageIds.length;
      const selectedFiles = files.slice(0, availableSlots);
      
      if (selectedFiles.length === 0) {
        setError('No se pueden añadir más imágenes. Elimine algunas existentes primero.');
        return;
      }
      
      // Generar previsualizaciones
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setNewPreviewImages([...newPreviewImages, ...newPreviews]);
      
      // Convertir imágenes a base64
      selectedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewStadiumImages(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Abrir modal para ver detalles del estadio
  const handleShowStadiumDetails = (stadium) => {
    setSelectedStadium(stadium);
    loadStadiumDetails(stadium.id);
    setShowModal(true);
  };

  // Función para verificar si una cadena es una imagen base64 válida
  const isValidBase64Image = (str) => {
    if (!str) return false;
    try {
      // Verificar que la cadena comience con data:image/
      const isValidStart = str.startsWith('data:image/');
      console.log('Validando imagen:', str.substring(0, 30) + '...', isValidStart);
      return isValidStart;
    } catch (e) {
      console.error('Error al validar imagen base64:', e);
      return false;
    }
  };

  // Función para abrir el modal de edición
  const handleShowEditModal = (stadium) => {
    setSelectedStadium(stadium);
    setEditName(stadium.name);
    setEditCharacteristics(stadium.characteristics);
    setNewStadiumImages([]);
    setNewPreviewImages([]);
    setRemovedImageIds([]);
    
    // Cargar imágenes actuales del estadio
    loadStadiumDetails(stadium.id, true); // El segundo parámetro indica que estamos en modo edición
    setShowEditModal(true);
  };

  // Eliminar una imagen existente en el modo de edición
  const markImageForRemoval = (imageId) => {
    setRemovedImageIds(prev => [...prev, imageId]);
  };

  // Restaurar una imagen marcada para eliminación
  const restoreRemovedImage = (imageId) => {
    setRemovedImageIds(prev => prev.filter(id => id !== imageId));
  };

  // Eliminar una nueva imagen en el modo de edición
  const removeNewImage = (index) => {
    const updatedPreviews = [...newPreviewImages];
    const updatedImages = [...newStadiumImages];
    
    updatedPreviews.splice(index, 1);
    updatedImages.splice(index, 1);
    
    setNewPreviewImages(updatedPreviews);
    setNewStadiumImages(updatedImages);
  };

  // Actualizar el estadio
  const handleUpdateStadium = async () => {
    setError(null);
    setSuccess(null);
    setUpdatingStadium(true);
    
    try {
      // 1. Actualizar la información básica del estadio
      await API.put(`/stadiums/${selectedStadium.id}`, {
        name: editName,
        characteristics: editCharacteristics
      });
      
      console.log('Información básica del estadio actualizada');
      
      // 2. Eliminar imágenes marcadas para eliminación
      if (removedImageIds.length > 0) {
        console.log('Eliminando imágenes:', removedImageIds);
        
        for (const imageId of removedImageIds) {
          try {
            await API.delete(`/associated-images/${imageId}`);
            console.log(`Imagen ${imageId} eliminada correctamente`);
          } catch (deleteError) {
            console.error(`Error al eliminar imagen ${imageId}:`, deleteError);
          }
        }
      }
      
      // 3. Subir nuevas imágenes
      if (newStadiumImages.length > 0) {
        console.log(`Subiendo ${newStadiumImages.length} nuevas imágenes`);
        
        for (let i = 0; i < newStadiumImages.length; i++) {
          try {
            const imageData = {
              image: newStadiumImages[i],
              id_stadium: selectedStadium.id
            };
            
            await API.post('/associated-images', imageData);
            console.log(`Nueva imagen ${i+1} subida correctamente`);
          } catch (uploadError) {
            console.error(`Error al subir nueva imagen ${i+1}:`, uploadError);
          }
        }
      }
      
      setSuccess('Estadio actualizado correctamente');
      setShowEditModal(false);
      
      // Recargar la lista de estadios y detalles
      loadStadiums();
      if (showModal) {
        loadStadiumDetails(selectedStadium.id);
      }
      
    } catch (err) {
      console.error('Error al actualizar estadio:', err);
      setError(err.response?.data?.message || 'Error al actualizar el estadio');
    } finally {
      setUpdatingStadium(false);
    }
  };

  return (
    <Container fluid>
      <Row className="justify-content-md-center mt-4">
        <Col md={10}>
          <h2 className="mb-4 text-primary">Crear Estadio</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formName">
                  <Form.Label>Nombre del Estadio</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ingrese el nombre del estadio"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3" controlId="formCharacteristics">
                  <Form.Label>Características</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Características del estadio"
                    value={characteristics}
                    onChange={(e) => setCharacteristics(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3" controlId="formImages">
              <Form.Label>Imágenes del Estadio (máximo 5)</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesUpload}
                disabled={previewImages.length >= 5}
              />
              <Form.Text className="text-muted">
                Seleccione hasta 5 imágenes para el estadio.
              </Form.Text>
            </Form.Group>
            
            {/* Vista previa de imágenes */}
            {previewImages.length > 0 && (
              <div className="mb-4">
                <h5>Vista previa:</h5>
                <Row className="g-2">
                  {previewImages.map((image, index) => (
                    <Col key={index} xs={6} md={4} lg={3} xl={2}>
                      <div 
                        className="position-relative mb-2" 
                        style={{
                          height: '150px',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}
                      >
                        <img 
                          src={image} 
                          alt={`Vista previa ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <Button 
                          variant="danger" 
                          size="sm"
                          className="position-absolute top-0 end-0 m-1"
                          onClick={() => removeImage(index)}
                        >
                          &times;
                        </Button>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mt-3"
              disabled={loading || previewImages.length === 0}
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
                'Crear Estadio'
              )}
            </Button>
          </Form>
        </Col>
      </Row>
      
      {/* Lista de estadios existentes */}
      <Row className="mt-5">
        <Col md={11} className="mx-auto">
          <h3 className="mb-4">Estadios Registrados</h3>
          
          {loadingStadiums ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando estadios...</span>
              </Spinner>
            </div>
          ) : (
            <Row>
              {stadiums.length > 0 ? (
                stadiums.map((stadium) => (
                  <Col md={6} lg={4} xl={3} key={stadium.id} className="mb-4">
                    <Card 
                      className="h-100 stadium-card"
                      style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                      onClick={() => handleShowStadiumDetails(stadium)}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Card.Body>
                        <Card.Title className="mb-3">{stadium.name}</Card.Title>
                        <Card.Text>
                          <strong>Características:</strong> {stadium.characteristics}
                        </Card.Text>
                        <div className="d-flex justify-content-between mt-2">
                          <small className="text-muted">Haga clic para ver imágenes</small>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation(); // Evitar que se active el onClick de la Card
                              handleShowEditModal(stadium);
                            }}
                          >
                            Editar
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col>
                  <Alert variant="info">
                    No hay estadios registrados. Cree el primer estadio usando el formulario.
                  </Alert>
                </Col>
              )}
            </Row>
          )}
        </Col>
      </Row>

      {/* Modal para ver las imágenes del estadio */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedStadium?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Características:</strong> {selectedStadium?.characteristics}</p>
          
          {console.log('Estado actual de stadiumDetails:', stadiumDetails)}
          
          {stadiumDetails ? (
            stadiumDetails.images && stadiumDetails.images.length > 0 ? (
              <Row className="g-3">
                {console.log('Número de imágenes encontradas:', stadiumDetails.images.length)}
                {stadiumDetails.images.map((imgData, index) => {
                  console.log(`Imagen ${index}:`, imgData.id, imgData.image?.substring(0, 30) + '...');
                  return (
                    <Col xs={12} md={6} key={index}>
                      <div 
                        style={{
                          height: '200px',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}
                      >
                        {isValidBase64Image(imgData.image) ? (
                          <img 
                            src={imgData.image} 
                            alt={`Imagen ${index + 1} de ${selectedStadium?.name}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              console.error('Error al cargar imagen:', index);
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/200x150?text=Error+de+imagen';
                            }}
                          />
                        ) : (
                          <div className="d-flex align-items-center justify-content-center h-100 bg-light">
                            <span className="text-muted">Imagen no disponible</span>
                          </div>
                        )}
                      </div>
                    </Col>
                  );
                })}
              </Row>
            ) : (
              <Alert variant="info">
                Este estadio no tiene imágenes asociadas.
              </Alert>
            )
          ) : (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando imágenes...</span>
              </Spinner>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => {
            setShowModal(false);
            handleShowEditModal(selectedStadium);
          }}>
            Editar
          </Button>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para editar el estadio */}
      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)} 
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Editar Estadio: {selectedStadium?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Estadio</Form.Label>
                  <Form.Control
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Características</Form.Label>
                  <Form.Control
                    type="text"
                    value={editCharacteristics}
                    onChange={(e) => setEditCharacteristics(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <h5 className="mt-4">Imágenes Actuales</h5>
            {stadiumDetails ? (
              <>
                {stadiumDetails.images && stadiumDetails.images.length > 0 ? (
                  <Row className="g-3 mb-4">
                    {stadiumDetails.images.map((imgData) => {
                      const isMarkedForRemoval = removedImageIds.includes(imgData.id);
                      
                      return (
                        <Col xs={6} md={4} key={imgData.id}>
                          <div 
                            className={`position-relative mb-2 ${isMarkedForRemoval ? 'opacity-50' : ''}`}
                            style={{
                              height: '150px',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}
                          >
                            {isValidBase64Image(imgData.image) ? (
                              <img 
                                src={imgData.image} 
                                alt={`Imagen de ${selectedStadium?.name}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <div className="d-flex align-items-center justify-content-center h-100 bg-light">
                                <span className="text-muted">Imagen no disponible</span>
                              </div>
                            )}
                            
                            {isMarkedForRemoval ? (
                              <Button 
                                variant="success" 
                                size="sm"
                                className="position-absolute top-0 end-0 m-1"
                                onClick={() => restoreRemovedImage(imgData.id)}
                              >
                                Restaurar
                              </Button>
                            ) : (
                              <Button 
                                variant="danger" 
                                size="sm"
                                className="position-absolute top-0 end-0 m-1"
                                onClick={() => markImageForRemoval(imgData.id)}
                              >
                                Eliminar
                              </Button>
                            )}
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                ) : (
                  <Alert variant="info" className="mb-4">
                    Este estadio no tiene imágenes asociadas.
                  </Alert>
                )}
              </>
            ) : (
              <div className="text-center py-3 mb-4">
                <Spinner animation="border" size="sm" />
                <span className="ms-2">Cargando imágenes...</span>
              </div>
            )}
            
            <h5>Añadir Nuevas Imágenes</h5>
            <Form.Group className="mb-3">
              <Form.Control
                type="file"
                accept="image/*"
                multiple
                onChange={handleEditImagesUpload}
                disabled={
                  (stadiumDetails?.images?.length || 0) - removedImageIds.length + newPreviewImages.length >= 5
                }
              />
              <Form.Text className="text-muted">
                Seleccione imágenes para añadir (máximo total de 5 imágenes).
              </Form.Text>
            </Form.Group>
            
            {/* Vista previa de nuevas imágenes */}
            {newPreviewImages.length > 0 && (
              <div className="mb-4">
                <h6>Vista previa de imágenes nuevas:</h6>
                <Row className="g-2">
                  {newPreviewImages.map((image, index) => (
                    <Col key={index} xs={6} md={4}>
                      <div 
                        className="position-relative mb-2" 
                        style={{
                          height: '150px',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}
                      >
                        <img 
                          src={image} 
                          alt={`Vista previa ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <Button 
                          variant="danger" 
                          size="sm"
                          className="position-absolute top-0 end-0 m-1"
                          onClick={() => removeNewImage(index)}
                        >
                          &times;
                        </Button>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateStadium}
            disabled={updatingStadium || (!editName || !editCharacteristics)}
          >
            {updatingStadium ? (
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