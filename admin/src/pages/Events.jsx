import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Table, Button, Badge, Spinner, Alert, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    currentPage: 1,
    limit: 20
  });

  useEffect(() => {
    fetchEvents(pagination.currentPage);
  }, [pagination.currentPage]);

  const fetchEvents = async (page = 1) => {
    try {
      setLoading(true);
      const response = await API.get(`/admin/events?page=${page}&limit=${pagination.limit}`);
      const data = response.data;
      setEvents(data.data || []);
      setPagination({
        total: data.total,
        pages: data.pages,
        currentPage: data.currentPage,
        limit: data.limit || pagination.limit
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (eventId, status) => {
    try {
      await API.put(`/admin/events/${eventId}/status`, { status });
      toast.success(`Statut mis à jour : ${status}`);
      fetchEvents(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Supprimer définitivement cet événement ?')) return;
    try {
      await API.delete(`/admin/events/${eventId}`);
      toast.success('Événement supprimé');
      fetchEvents(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handlePageChange = (page) => {
    setPagination({ ...pagination, currentPage: page });
  };

  if (loading && events.length === 0) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h2>Gestion des événements</h2>
      {events.length === 0 ? (
        <Alert variant="info">Aucun événement trouvé.</Alert>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Titre</th>
                <th>Organisateur</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id}>
                  <td>{event.id}</td>
                  <td>{event.title}</td>
                  <td>{event.seller?.email}</td>
                  <td>{new Date(event.date).toLocaleDateString()}</td>
                  <td>
                    <Badge bg={
                      event.status === 'published' ? 'success' :
                      event.status === 'paused' ? 'warning' :
                      event.status === 'cancelled' ? 'danger' : 'secondary'
                    }>
                      {event.status}
                    </Badge>
                  </td>
                  <td>
                    <Button size="sm" variant="success" onClick={() => updateStatus(event.id, 'published')} className="me-2">
                      Publier
                    </Button>
                    <Button size="sm" variant="warning" onClick={() => updateStatus(event.id, 'paused')} className="me-2">
                      Suspendre
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => deleteEvent(event.id)}>
                      Supprimer
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {pagination.pages > 1 && (
            <Pagination>
              <Pagination.Prev 
                onClick={() => handlePageChange(pagination.currentPage - 1)} 
                disabled={pagination.currentPage === 1}
              />
              {[...Array(pagination.pages).keys()].map(num => (
                <Pagination.Item 
                  key={num + 1} 
                  active={num + 1 === pagination.currentPage}
                  onClick={() => handlePageChange(num + 1)}
                >
                  {num + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next 
                onClick={() => handlePageChange(pagination.currentPage + 1)} 
                disabled={pagination.currentPage === pagination.pages}
              />
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}

export default Events;