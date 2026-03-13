import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Table, Badge, Spinner, Alert, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaMoneyBillWave } from 'react-icons/fa';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    currentPage: 1,
    limit: 20
  });

  useEffect(() => {
    fetchTransactions(pagination.currentPage);
  }, [pagination.currentPage]);

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true);
      const response = await API.get(`/admin/transactions?page=${page}&limit=${pagination.limit}`);
      const data = response.data;
      setTransactions(data.data || []);
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

  const handlePageChange = (page) => {
    setPagination({ ...pagination, currentPage: page });
  };

  const getStatusBadge = (status) => {
    const config = {
      paid: { bg: '#10b981', label: 'Payé' },
      pending: { bg: '#f59e0b', label: 'En attente' },
      failed: { bg: '#ef4444', label: 'Échoué' },
      refunded: { bg: '#6c757d', label: 'Remboursé' }
    };
    const { bg, label } = config[status] || { bg: '#6c757d', label: status };
    return (
      <Badge style={{ backgroundColor: bg, color: '#fff', padding: '0.5em 0.8em', borderRadius: '20px', fontWeight: 500 }}>
        {label}
      </Badge>
    );
  };

  if (loading && transactions.length === 0) {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner animation="border" variant="warning" style={{ width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
        <Alert variant="danger" className="rounded-4 shadow-sm">{error}</Alert>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
      <div className="d-flex align-items-center mb-4">
        <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
          <FaMoneyBillWave style={{ color: '#10b981' }} size={28} />
        </div>
        <div>
          <h2 className="fw-bold" style={{ color: '#0f172a' }}>Flux transactionnel</h2>
          <p className="text-muted mb-0">Suivi des paiements et commandes</p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <Alert variant="info" className="text-center py-5 rounded-4">Aucune transaction trouvée.</Alert>
      ) : (
        <>
          <div className="table-responsive bg-white rounded-4 shadow-sm p-3">
            <Table hover className="align-middle mb-0">
              <thead style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}>
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
                {transactions.map(order => (
                  <tr key={order.id}>
                    <td className="fw-semibold">#{order.id}</td>
                    <td>{order.buyer?.email || '—'}</td>
                    <td>{order.event?.title || '—'}</td>
                    <td className="fw-semibold" style={{ color: '#0f172a' }}>{order.total_amount} CDF</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>{new Date(order.createdAt).toLocaleString('fr-FR')}</td>
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
                style={{ color: '#0f172a' }}
              />
              {[...Array(pagination.pages).keys()].map(num => (
                <Pagination.Item
                  key={num + 1}
                  active={num + 1 === pagination.currentPage}
                  onClick={() => handlePageChange(num + 1)}
                  style={{
                    backgroundColor: num + 1 === pagination.currentPage ? '#10b981' : 'transparent',
                    borderColor: num + 1 === pagination.currentPage ? '#10b981' : '#dee2e6',
                    color: num + 1 === pagination.currentPage ? '#fff' : '#0f172a'
                  }}
                >
                  {num + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.pages}
                style={{ color: '#0f172a' }}
              />
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}

export default Transactions;