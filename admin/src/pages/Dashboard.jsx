import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { useSocket } from '../contexts/SocketContext';
import { toast } from 'react-toastify';
import { SalesChart, RegistrationsChart } from '../components/Charts';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [advancedStats, setAdvancedStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const socket = useSocket();

  const fetchStats = async () => {
    try {
      const response = await API.get('/admin/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Erreur stats:', err.response?.data || err.message);
      throw err;
    }
  };

  const fetchAdvancedStats = async () => {
    try {
      const response = await API.get('/admin/stats/advanced');
      setAdvancedStats(response.data);
    } catch (err) {
      console.error('Erreur advanced stats:', err.response?.data || err.message);
      throw err;
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchAdvancedStats()])
      .catch(err => {
        setError('Erreur de chargement');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('new-order', () => {
      fetchStats();
      fetchAdvancedStats();
    });
    socket.on('event-status-changed', fetchAdvancedStats);

    return () => {
      socket.off('new-order');
      socket.off('event-status-changed');
    };
  }, [socket]);

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h2>Tableau de bord</h2>
      <Row className="mt-4">
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <Card.Title>Événements</Card.Title>
              <h3>{stats?.totalEvents}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <Card.Title>Utilisateurs</Card.Title>
              <h3>{stats?.totalUsers}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <Card.Title>Commandes</Card.Title>
              <h3>{stats?.totalOrders}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <Card.Title>CA (CDF)</Card.Title>
              <h3>{stats?.totalRevenue}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {advancedStats && (
        <>
          <Row className="mt-5">
            <Col md={12}>
              <Card>
                <Card.Header>Évolution du chiffre d'affaires (12 derniers mois)</Card.Header>
                <Card.Body>
                  {advancedStats.monthlySales && advancedStats.monthlySales.length > 0 ? (
                    <SalesChart data={advancedStats.monthlySales} />
                  ) : (
                    <p>Aucune donnée de vente disponible</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row className="mt-4">
            <Col md={12}>
              <Card>
                <Card.Header>Inscriptions mensuelles (12 derniers mois)</Card.Header>
                <Card.Body>
                  {advancedStats.monthlyRegistrations && advancedStats.monthlyRegistrations.length > 0 ? (
                    <RegistrationsChart data={advancedStats.monthlyRegistrations} />
                  ) : (
                    <p>Aucune donnée d'inscription disponible</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}

export default Dashboard;