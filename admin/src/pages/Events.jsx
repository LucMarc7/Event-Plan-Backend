import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Table, Button, Badge, Spinner, Alert, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaBan, FaPlay, FaTrash } from 'react-icons/fa';

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

  const getStatusBadge = (status) => {
    const config = {
      published: { bg: 'var(--success)', label: 'Publié' },
      paused: { bg: 'var(--warning)', label: 'Suspendu' },
      cancelled: { bg: 'var(--danger)', label: 'Annulé' },
      draft: { bg: 'var(--secondary)', label: 'Brouillon' }
    };
    const { bg, label } = config[status] || { bg: 'var(--secondary)', label: status };
    return (
      <Badge
        style={{
          backgroundColor: bg,
          color: '#fff',
          fontWeight: 500,
          padding: '0.5em 0.8em',
          borderRadius: '20px'
        }}
      >
        {label}
      </Badge>
    );
  };

  if (loading && events.length === 0) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" className="m-4">{error}</Alert>;
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <h2 className="fw-bold mb-4" style={{ color: 'var(--dark)' }}>Gestion des événements</h2>
      {events.length === 0 ? (
        <Alert variant="info" className="text-center py-5 rounded-4">Aucun événement trouvé.</Alert>
      ) : (
        <>
          <div className="table-responsive bg-white rounded-4 shadow-sm p-3">
            <Table hover className="align-middle mb-0 table-custom">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Titre</th>
                  <th>Organisateur</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th style={{ width: '220px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id}>
                    <td className="fw-semibold">#{event.id}</td>
                    <td>{event.title}</td>
                    <td>{event.seller?.email || '—'}</td>
                    <td>{new Date(event.date).toLocaleDateString('fr-FR')}</td>
                    <td>{getStatusBadge(event.status)}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-success"
                          className="rounded-pill px-3 btn-custom"
                          onClick={() => updateStatus(event.id, 'published')}
                          title="Publier"
                        >
                          <FaPlay size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-warning"
                          className="rounded-pill px-3 btn-custom"
                          onClick={() => updateStatus(event.id, 'paused')}
                          title="Suspendre"
                        >
                          <FaBan size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          className="rounded-pill px-3 btn-custom"
                          onClick={() => deleteEvent(event.id)}
                          title="Supprimer"
                        >
                          <FaTrash size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {pagination.pages > 1 && (
            <Pagination className="justify-content-center mt-4">
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