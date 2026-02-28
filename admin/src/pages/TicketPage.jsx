import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';
import { Container, Card, Button, Spinner, Alert } from 'react-bootstrap';

function TicketPage() {
  const { orderId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await API.get(`/orders/${orderId}/ticket`);
        setTicket(response.data.ticket);
      } catch (err) {
        setError(err.response?.data?.error || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [orderId]);

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container className="mt-5 d-flex justify-content-center">
      <Card style={{ width: '400px' }} className="shadow">
        <Card.Body>
          <Card.Title className="text-center">Votre billet</Card.Title>
          <img src={ticket} alt="QR Code" className="img-fluid" />
          <div className="text-center mt-3">
            <Button variant="primary" onClick={() => window.print()}>Imprimer</Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default TicketPage;