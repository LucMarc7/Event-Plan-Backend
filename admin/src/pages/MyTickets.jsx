import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Container, Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';

function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      // On suppose une route /api/tickets/me pour récupérer tous les billets de l'utilisateur
      const response = await API.get('/tickets/me');
      setTickets(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des billets');
    } finally {
      setLoading(false);
    }
  };

  const showQR = async (ticketId) => {
    try {
      const response = await API.get(`/tickets/${ticketId}/qr`);
      const qrDataUrl = response.data.qr;
      // Ouvrir dans une nouvelle fenêtre ou afficher dans une modal
      const win = window.open();
      win.document.write(`<img src="${qrDataUrl}" style="width:300px;height:300px"/>`);
    } catch (err) {
      toast.error('Erreur chargement QR');
    }
  };

  if (loading) return <Spinner />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container>
      <h2>Mes billets</h2>
      <Row>
        {tickets.map(ticket => (
          <Col md={4} key={ticket.id} className="mb-3">
            <Card>
              <Card.Body>
                <Card.Title>{ticket.Event?.title}</Card.Title>
                <Card.Text>
                  <strong>Date :</strong> {new Date(ticket.Event?.date).toLocaleString()}<br />
                  <strong>Catégorie :</strong> {ticket.category_name}<br />
                  <strong>Prix :</strong> {ticket.price} CDF<br />
                  <strong>Statut :</strong> {ticket.used ? 'Utilisé' : 'Valide'}
                </Card.Text>
                <Button variant="primary" onClick={() => showQR(ticket.id)}>
                  Voir QR Code
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default MyTickets;