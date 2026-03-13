import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Table, Button, Form, Modal, Spinner, Alert, Badge, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { FaDownload, FaPlus, FaToggleOn, FaToggleOff, FaTrash } from 'react-icons/fa';

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

  const getRoleBadge = (role) => {
    const config = {
      superadmin: { bg: '#ef4444', label: 'Super Admin' },
      admin: { bg: '#f59e0b', label: 'Admin' },
      seller: { bg: '#10b981', label: 'Vendeur' },
      buyer: { bg: '#6c757d', label: 'Acheteur' }
    };
    const { bg, label } = config[role] || { bg: '#6c757d', label: role };
    return (
      <Badge style={{ backgroundColor: bg, color: '#fff', padding: '0.5em 0.8em', borderRadius: '20px', fontWeight: 500 }}>
        {label}
      </Badge>
    );
  };

  const getActiveBadge = (active) => {
    return (
      <Badge style={{
        backgroundColor: active ? '#10b981' : '#6c757d',
        color: '#fff',
        padding: '0.5em 0.8em',
        borderRadius: '20px',
        fontWeight: 500
      }}>
        {active ? 'Actif' : 'Inactif'}
      </Badge>
    );
  };

  if (user?.role !== 'superadmin') {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
        <Alert variant="danger" className="rounded-4 shadow-sm">Accès réservé au super administrateur.</Alert>
      </div>
    );
  }

  if (loading && users.length === 0) {
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: '#0f172a' }}>Gestion des utilisateurs</h2>
        <div>
          <Button
            variant="success"
            onClick={exportUsers}
            className="rounded-pill px-4 py-2 border-0 fw-semibold me-2"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #0f9d6b 100%)' }}
          >
            <FaDownload className="me-2" /> Exporter CSV
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
            className="rounded-pill px-4 py-2 border-0 fw-semibold"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #0f9d6b 100%)' }}
          >
            <FaPlus className="me-2" /> Ajouter un admin
          </Button>
        </div>
      </div>

      {users.length === 0 ? (
        <Alert variant="info" className="text-center py-5 rounded-4">Aucun utilisateur trouvé.</Alert>
      ) : (
        <>
          <div className="table-responsive bg-white rounded-4 shadow-sm p-3">
            <Table hover className="align-middle mb-0">
              <thead style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Nom</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th style={{ width: '300px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="fw-semibold">#{u.id}</td>
                    <td>{u.email}</td>
                    <td>{u.name || '-'}</td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>{getActiveBadge(u.active)}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        {/* Sélecteur de rôle stylisé */}
                        <Form.Select
                          size="sm"
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="rounded-pill w-auto bg-light border-0"
                          style={{ boxShadow: 'none', padding: '0.3rem 1rem' }}
                        >
                          <option value="buyer">Acheteur</option>
                          <option value="seller">Vendeur</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">Super Admin</option>
                        </Form.Select>

                        {/* Bouton activer/désactiver */}
                        <Button
                          size="sm"
                          variant={u.active ? 'outline-warning' : 'outline-success'}
                          className="rounded-pill px-3"
                          onClick={() => handleToggleActive(u.id, u.active)}
                          title={u.active ? 'Désactiver' : 'Activer'}
                          style={{
                            borderColor: u.active ? '#f59e0b' : '#10b981',
                            color: u.active ? '#f59e0b' : '#10b981'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = u.active ? '#f59e0b' : '#10b981';
                            e.target.style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = u.active ? '#f59e0b' : '#10b981';
                          }}
                        >
                          {u.active ? <FaToggleOff size={12} /> : <FaToggleOn size={12} />}
                        </Button>

                        {/* Bouton supprimer */}
                        <Button
                          size="sm"
                          variant="outline-danger"
                          className="rounded-pill px-3"
                          onClick={() => handleDeleteUser(u.id)}
                          title="Supprimer"
                          style={{ borderColor: '#ef4444', color: '#ef4444' }}
                          onMouseEnter={(e) => { e.target.style.backgroundColor = '#ef4444'; e.target.style.color = '#fff'; }}
                          onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#ef4444'; }}
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

      {/* Modal de création d'administrateur */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: '#0f172a' }}>Nouvel administrateur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">Email</Form.Label>
              <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                <Form.Control
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  className="border-0 bg-transparent"
                  style={{ boxShadow: 'none' }}
                />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">Mot de passe</Form.Label>
              <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                <Form.Control
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  className="border-0 bg-transparent"
                  style={{ boxShadow: 'none' }}
                />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">Rôle</Form.Label>
              <div className="border rounded-3 p-2 bg-light">
                <Form.Select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                  className="border-0 bg-transparent"
                  style={{ boxShadow: 'none' }}
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </Form.Select>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowModal(false)} className="rounded-pill px-4">
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateAdmin}
            className="rounded-pill px-4 border-0"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #0f9d6b 100%)' }}
          >
            Créer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Users;