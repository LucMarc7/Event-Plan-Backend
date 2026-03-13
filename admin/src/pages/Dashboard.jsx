import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Row, Col, Card, Table, Badge } from 'react-bootstrap';
import { FaArrowUp, FaArrowDown, FaDollarSign, FaTicketAlt, FaUsers, FaShoppingCart } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchTransactions();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await API.get('/admin/stats');
      setStats(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await API.get('/admin/transactions?limit=5');
      setTransactions(response.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Données factices pour le graphique (à remplacer par des données réelles)
  const mockChartData = [
    { name: 'Jan', value: 4000 },
    { name: 'Fév', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Avr', value: 4500 },
    { name: 'Mai', value: 6000 },
    { name: 'Juin', value: 5500 },
    { name: 'Juil', value: 7000 },
  ];

  const statCards = [
    {
      title: 'Revenu total',
      value: stats?.totalRevenue?.toLocaleString() || '0',
      icon: <FaDollarSign />,
      change: '+12%',
      positive: true,
    },
    {
      title: 'Événements',
      value: stats?.totalEvents || '0',
      icon: <FaTicketAlt />,
      change: '+5%',
      positive: true,
    },
    {
      title: 'Utilisateurs',
      value: stats?.totalUsers || '0',
      icon: <FaUsers />,
      change: '+8%',
      positive: true,
    },
    {
      title: 'Commandes',
      value: stats?.totalOrders || '0',
      icon: <FaShoppingCart />,
      change: '-3%',
      positive: false,
    },
  ];

  return (
    <div>
      <h2 className="mb-4 fw-bold">Dashboard</h2>

      <Row className="g-4 mb-4">
        {statCards.map((card, idx) => (
          <Col key={idx} md={3}>
            <div className="stat-card">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="stat-title">{card.title}</p>
                  <h3 className="stat-value">{card.value}</h3>
                  <span className={`stat-change ${card.positive ? 'positive' : 'negative'}`}>
                    {card.positive ? <FaArrowUp /> : <FaArrowDown />}
                    {card.change}
                  </span>
                </div>
                <div className="stat-icon">{card.icon}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <Row className="mb-4">
        <Col md={8}>
          <Card className="stat-card">
            <Card.Body>
              <h5 className="fw-semibold mb-3">Évolution des revenus</h5>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="stat-card h-100">
            <Card.Body>
              <h5 className="fw-semibold mb-3">Objectif de paiement</h5>
              <p className="text-muted small">Total amount goal</p>
              <h2 className="fw-bold">$78,989.09</h2>
              <p className="text-success">+3,945 USD</p>
              <div className="bg-light p-3 rounded">
                <small>29 Jun, 2025 - 29 August, 2025</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="stat-card">
        <Card.Body>
          <h5 className="fw-semibold mb-3">Transactions récentes</h5>
          <Table responsive className="table-custom">
            <thead>
              <tr>
                <th>ID</th>
                <th>Acheteur</th>
                <th>Événement</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>#{tx.id}</td>
                  <td>{tx.buyer?.email}</td>
                  <td>{tx.event?.title}</td>
                  <td>{tx.total_amount} CDF</td>
                  <td>
                    <Badge bg={tx.status === 'paid' ? 'success' : tx.status === 'pending' ? 'warning' : 'danger'}>
                      {tx.status}
                    </Badge>
                  </td>
                  <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Dashboard;