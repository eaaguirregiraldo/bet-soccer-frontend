import React from 'react';
import { Container, Row, Col, Card, ListGroup } from 'react-bootstrap';

export default function Home() {
  return (
    <Container className="py-5">
      <Row className="mb-5 align-items-center">
        <Col md={6}>
          <h1 className="display-4 fw-bold mb-4">Bienvenido a Bet Soccer</h1>
          <p className="lead">
            La mejor plataforma para apostar en los partidos de fútbol y competir con tus amigos.
            ¿Tienes lo que se necesita para predecir los resultados correctos?
          </p>
          <button className="btn btn-primary btn-lg">Comenzar a Apostar</button>
        </Col>
        <Col md={6} className="text-center">
          <img
            src="/logo_mundial_clubs_usa.png"
            alt="Bet Soccer Home"
            className="img-fluid rounded shadow"
            style={{ maxHeight: '400px' }}
          />
        </Col>
      </Row>

      <Row className="mt-5">
        <Col>
          <Card className="shadow-sm">
            <Card.Header as="h2" className="bg-primary text-white">
              Reglas del Juego
            </Card.Header>
            <Card.Body>
              <p className="lead">
                Para participar en nuestras pollas de fútbol, necesitas conocer las siguientes reglas:
              </p>
              <ListGroup variant="flush" className="mb-4">
                <ListGroup.Item className="d-flex align-items-start">
                  <div className="me-3 bg-primary text-white rounded-circle p-2" style={{ width: '36px', height: '36px', textAlign: 'center' }}>1</div>
                  <div>
                    <strong>Tiempo límite para modificar apuestas:</strong> Solo se permite modificar las apuestas hasta 10 minutos antes del inicio de los partidos.
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex align-items-start">
                  <div className="me-3 bg-primary text-white rounded-circle p-2" style={{ width: '36px', height: '36px', textAlign: 'center' }}>2</div>
                  <div>
                    <strong>Marcador exacto:</strong> El que acierte al marcador pleno obtendrá 10 puntos para el partido que hubiese acertado.
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex align-items-start">
                  <div className="me-3 bg-primary text-white rounded-circle p-2" style={{ width: '36px', height: '36px', textAlign: 'center' }}>3</div>
                  <div>
                    <strong>Resultado del partido:</strong> Si acierta el ganador o si empataron obtendrá 3 puntos por acertar ganador o empate.
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex align-items-start">
                  <div className="me-3 bg-primary text-white rounded-circle p-2" style={{ width: '36px', height: '36px', textAlign: 'center' }}>4</div>
                  <div>
                    <strong>Marcador parcial:</strong> Si acierta uno de los dos marcadores obtendrá 1 punto.
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex align-items-start">
                  <div className="me-3 bg-primary text-white rounded-circle p-2" style={{ width: '36px', height: '36px', textAlign: 'center' }}>5</div>
                  <div>
                    <strong>Premios:</strong> El ganador de la polla recibirá el 70% del dinero recaudado, el segundo el 20% y el tercero el 10%. 
                    <ul className="mt-2">
                      <li>Si hay empate en el segundo lugar, el tercero no obtendrá nada y se repartirá el 30% entre todos los segundos lugares.</li>
                      <li>Si hay empate en el primer lugar se repartirá el 70% del dinero entre todos los empatados en primer lugar.</li>
                    </ul>
                  </div>
                </ListGroup.Item>
              </ListGroup>
              <Card.Text className="text-center mt-4 text-muted">
                ¡Demuestra tus conocimientos futbolísticos y gana increíbles premios!
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}