import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Table, Badge, Spinner, Alert, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';

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

  if (loading && transactions.length === 0) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h2>Flux transactionnel</h2>
      {transactions.length === 0 ? (
        <Alert variant="info">Aucune transaction trouvée.</Alert>
      ) : (
        <>
          <Table striped bordered hover responsive>
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
              {transactions.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.buyer?.email}</td>
                  <td>{order.event?.title}</td>
                  <td>{order.total_amount} CDF</td>
                  <td>
                    <Badge bg={
                      order.status === 'paid' ? 'success' :
                      order.status === 'pending' ? 'warning' : 'danger'
                    }>
                      {order.status}
                    </Badge>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
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

export default Transactions;