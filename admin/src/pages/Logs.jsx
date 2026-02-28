import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Table, Spinner, Alert } from 'react-bootstrap';

function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await API.get('/admin/logs');
        setLogs(response.data);
      } catch (err) {
        setError('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h2>Journal d'audit</h2>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Date</th>
            <th>Admin</th>
            <th>Action</th>
            <th>Cible</th>
            <th>ID cible</th>
            <th>Détails</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{new Date(log.createdAt).toLocaleString()}</td>
              <td>{log.admin?.email}</td>
              <td>{log.action}</td>
              <td>{log.target_type}</td>
              <td>{log.target_id}</td>
              <td><pre style={{ maxWidth: '200px', overflow: 'auto' }}>{log.details}</pre></td>
              <td>{log.ip_address}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default Logs;