import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Table, Button, Form, Modal, Spinner, Alert, Badge, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', role: 'admin' });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    currentPage: 1,
    limit: 20
  });


  const exportUsers = async () => {
  try {
    const response = await API.get('/admin/users/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'users.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    toast.error('Erreur export');
  }
};

  useEffect(() => {
    if (user?.role === 'superadmin') {
      fetchUsers(pagination.currentPage);
    }
  }, [user, pagination.currentPage]);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await API.get(`/admin/users?page=${page}&limit=${pagination.limit}`);
      const data = response.data;
      setUsers(data.data || []);
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

  const handleCreateAdmin = async () => {
    try {
      await API.post('/admin/users', newAdmin);
      toast.success('Administrateur créé');
      setShowModal(false);
      fetchUsers(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await API.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('Rôle mis à jour');
      fetchUsers(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    try {
      await API.put(`/admin/users/${userId}/toggle`, { active: !currentActive });
      toast.success(`Utilisateur ${!currentActive ? 'activé' : 'désactivé'}`);
      fetchUsers(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Supprimer définitivement cet utilisateur ? Cette action est irréversible.')) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      toast.success('Utilisateur supprimé');
      fetchUsers(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handlePageChange = (page) => {
    setPagination({ ...pagination, currentPage: page });
  };

  if (user?.role !== 'superadmin') {
    return <Alert variant="danger">Accès réservé au super administrateur.</Alert>;
  }

  if (loading && users.length === 0) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h2>Gestion des utilisateurs</h2>
      <Button variant="primary" onClick={() => setShowModal(true)} className="mb-3">
        Ajouter un administrateur
      </Button>
      <Button variant="success" onClick={exportUsers} className="mb-3 ms-2">
        Exporter CSV
      </Button>
      {users.length === 0 ? (
        <Alert variant="info">Aucun utilisateur trouvé.</Alert>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Nom</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.email}</td>
                  <td>{u.name || '-'}</td>
                  <td>
                    <Badge bg={u.role === 'superadmin' ? 'danger' : u.role === 'admin' ? 'warning' : 'info'}>
                      {u.role}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={u.active ? 'success' : 'secondary'}>
                      {u.active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                  <td>
                    <Form.Select 
                      size="sm" 
                      value={u.role} 
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="d-inline-block w-auto me-2"
                    >
                      <option value="buyer">Acheteur</option>
                      <option value="seller">Vendeur</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </Form.Select>
                    <Button 
                      size="sm" 
                      variant={u.active ? 'warning' : 'success'} 
                      onClick={() => handleToggleActive(u.id, u.active)}
                      className="me-2"
                    >
                      {u.active ? 'Désactiver' : 'Activer'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="danger" 
                      onClick={() => handleDeleteUser(u.id)}
                    >
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

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Nouvel administrateur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mot de passe</Form.Label>
              <Form.Control
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Rôle</Form.Label>
              <Form.Select
                value={newAdmin.role}
                onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleCreateAdmin}>
            Créer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Users;