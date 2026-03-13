import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Tabs, Tab, Table, Button, Badge, Spinner, Alert, Form, Modal, Row, Col } from 'react-bootstrap';
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaKey, FaUserPlus, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

function UserManagement() {
  const { user: currentUser } = useAuth();
  const [platformUsers, setPlatformUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'buyer',
    category: '',
    active: true
  });
  const [newPassword, setNewPassword] = useState('');

  // Pagination
  const [platformPage, setPlatformPage] = useState(1);
  const [adminPage, setAdminPage] = useState(1);
  const [platformTotal, setPlatformTotal] = useState(0);
  const [adminTotal, setAdminTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const platformRes = await API.get(`/admin/users?role=buyer,seller&page=${platformPage}&limit=${limit}`);
      const adminRes = await API.get(`/admin/users?role=admin,superadmin&page=${adminPage}&limit=${limit}`);

      setPlatformUsers(platformRes.data.data || []);
      setPlatformTotal(platformRes.data.total || 0);
      setAdminUsers(adminRes.data.data || []);
      setAdminTotal(adminRes.data.total || 0);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name || '',
      role: user.role,
      category: user.category || '',
      active: user.active
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    try {
      await API.put(`/admin/users/${selectedUser.id}`, formData);
      toast.success('Utilisateur mis à jour');
      setShowEditModal(false);
      fetchAllUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await API.put(`/admin/users/${user.id}`, { active: !user.active });
      toast.success(`Utilisateur ${!user.active ? 'activé' : 'désactivé'}`);
      fetchAllUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.email} ?`)) return;
    try {
      await API.delete(`/admin/users/${user.id}`);
      toast.success('Utilisateur supprimé');
      fetchAllUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword) {
      toast.error('Veuillez entrer un mot de passe');
      return;
    }
    try {
      await API.put(`/admin/users/${selectedUser.id}/password`, { password: newPassword });
      toast.success('Mot de passe modifié');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleCreateUser = async () => {
    try {
      await API.post('/admin/users', formData);
      toast.success('Utilisateur créé');
      setShowCreateModal(false);
      setFormData({ email: '', name: '', role: 'buyer', category: '', active: true });
      fetchAllUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  if (currentUser?.role !== 'superadmin') {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
        <Alert variant="danger" className="rounded-4 shadow-sm">Accès réservé au super administrateur.</Alert>
      </div>
    );
  }

  if (loading) {
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
        <Button
          variant="success"
          onClick={() => setShowCreateModal(true)}
          className="rounded-pill px-4 py-2 border-0 fw-semibold"
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #0f9d6b 100%)' }}
        >
          <FaUserPlus className="me-2" /> Créer un utilisateur
        </Button>
      </div>

      <Tabs defaultActiveKey="platform" id="user-management-tabs" className="mb-3" variant="pills">
        <Tab
          eventKey="platform"
          title={
            <span>
              Utilisateurs plateforme <Badge bg="secondary" className="ms-1">{platformTotal}</Badge>
            </span>
          }
          tabClassName="text-dark"
        >
          <UserTable
            users={platformUsers}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            onDelete={handleDeleteUser}
            onPassword={(user) => { setSelectedUser(user); setShowPasswordModal(true); }}
          />
        </Tab>
        <Tab
          eventKey="admins"
          title={
            <span>
              Administrateurs <Badge bg="secondary" className="ms-1">{adminTotal}</Badge>
            </span>
          }
          tabClassName="text-dark"
        >
          <UserTable
            users={adminUsers}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            onDelete={handleDeleteUser}
            onPassword={(user) => { setSelectedUser(user); setShowPasswordModal(true); }}
          />
        </Tab>
      </Tabs>

      {/* Modal d'édition */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: '#0f172a' }}>Modifier l'utilisateur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">Email</Form.Label>
              <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                <Form.Control
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="border-0 bg-transparent"
                  style={{ boxShadow: 'none' }}
                />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">Nom (optionnel)</Form.Label>
              <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="border-0 bg-transparent"
                  style={{ boxShadow: 'none' }}
                />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">Rôle</Form.Label>
              <div className="border rounded-3 p-2 bg-light">
                <Form.Select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="border-0 bg-transparent"
                  style={{ boxShadow: 'none' }}
                >
                  <option value="buyer">Acheteur</option>
                  <option value="seller">Vendeur</option>
                  <option value="admin">Admin secondaire</option>
                  <option value="superadmin">Super Admin</option>
                </Form.Select>
              </div>
            </Form.Group>
            {formData.role === 'seller' && (
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small text-muted">Catégorie de vendeur</Form.Label>
                <div className="border rounded-3 p-2 bg-light">
                  <Form.Select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="border-0 bg-transparent"
                    style={{ boxShadow: 'none' }}
                  >
                    <option value="">Sélectionnez</option>
                    <option value="organizer">Organisateur</option>
                    <option value="artist">Artiste</option>
                    <option value="enterprise">Entreprise</option>
                    <option value="manager">Manager</option>
                    <option value="coach">Coach</option>
                    <option value="favorite">Favorite</option>
                  </Form.Select>
                </div>
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <div className="d-flex align-items-center">
                <Form.Check
                  type="checkbox"
                  id="active-check"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="me-2"
                />
                <Form.Label htmlFor="active-check" className="mb-0">Compte actif</Form.Label>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowEditModal(false)} className="rounded-pill px-4">
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateUser}
            className="rounded-pill px-4 border-0"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #0f9d6b 100%)' }}
          >
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de création */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: '#0f172a' }}>Créer un utilisateur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">Email *</Form.Label>
              <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                <Form.Control
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="border-0 bg-transparent"
                  style={{ boxShadow: 'none' }}
                />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">Mot de passe *</Form.Label>
              <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                <Form.Control
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  className="border-0 bg-transparent"
                  style={{ boxShadow: 'none' }}
                />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">Nom (optionnel)</Form.Label>
              <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="border-0 bg-transparent"
                  style={{ boxShadow: 'none' }}
                />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">Rôle</Form.Label>
              <div className="border rounded-3 p-2 bg-light">
                <Form.Select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="border-0 bg-transparent"
                  style={{ boxShadow: 'none' }}
                >
                  <option value="buyer">Acheteur</option>
                  <option value="seller">Vendeur</option>
                  <option value="admin">Admin secondaire</option>
                  <option value="superadmin">Super Admin</option>
                </Form.Select>
              </div>
            </Form.Group>
            {formData.role === 'seller' && (
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small text-muted">Catégorie de vendeur</Form.Label>
                <div className="border rounded-3 p-2 bg-light">
                  <Form.Select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="border-0 bg-transparent"
                    style={{ boxShadow: 'none' }}
                  >
                    <option value="">Sélectionnez</option>
                    <option value="organizer">Organisateur</option>
                    <option value="artist">Artiste</option>
                    <option value="enterprise">Entreprise</option>
                    <option value="manager">Manager</option>
                    <option value="coach">Coach</option>
                    <option value="favorite">Favorite</option>
                  </Form.Select>
                </div>
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <div className="d-flex align-items-center">
                <Form.Check
                  type="checkbox"
                  id="active-create"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="me-2"
                />
                <Form.Label htmlFor="active-create" className="mb-0">Compte actif</Form.Label>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="rounded-pill px-4">
            Annuler
          </Button>
          <Button
            variant="success"
            onClick={handleCreateUser}
            className="rounded-pill px-4 border-0"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #0f9d6b 100%)' }}
          >
            Créer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de changement de mot de passe */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: '#0f172a' }}>Changer le mot de passe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label className="fw-semibold small text-muted">Nouveau mot de passe</Form.Label>
              <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                <Form.Control
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border-0 bg-transparent"
                  style={{ boxShadow: 'none' }}
                />
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)} className="rounded-pill px-4">
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handlePasswordChange}
            className="rounded-pill px-4 border-0"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #0f9d6b 100%)' }}
          >
            Changer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

// Sous-composant Tableau utilisateur
function UserTable({ users, onEdit, onToggleActive, onDelete, onPassword }) {
  return (
    <div className="table-responsive bg-white rounded-4 shadow-sm p-3">
      <Table hover className="align-middle mb-0">
        <thead style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Nom</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th style={{ width: '200px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td className="fw-semibold">#{u.id}</td>
              <td>{u.email}</td>
              <td>{u.name || '-'}</td>
              <td>
                <Badge
                  style={{
                    backgroundColor:
                      u.role === 'superadmin' ? '#ef4444' :
                      u.role === 'admin' ? '#f59e0b' :
                      u.role === 'seller' ? '#10b981' : '#6c757d',
                    color: '#fff',
                    padding: '0.5em 0.8em',
                    borderRadius: '20px',
                    fontWeight: 500
                  }}
                >
                  {u.role}
                </Badge>
              </td>
              <td>
                <Badge
                  style={{
                    backgroundColor: u.active ? '#10b981' : '#6c757d',
                    color: '#fff',
                    padding: '0.5em 0.8em',
                    borderRadius: '20px',
                    fontWeight: 500
                  }}
                >
                  {u.active ? 'Actif' : 'Inactif'}
                </Badge>
              </td>
              <td>
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="outline-info"
                    className="rounded-pill px-3"
                    onClick={() => onEdit(u)}
                    title="Modifier"
                    style={{ borderColor: '#10b981', color: '#10b981' }}
                    onMouseEnter={(e) => { e.target.style.backgroundColor = '#10b981'; e.target.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#10b981'; }}
                  >
                    <FaEdit size={12} />
                  </Button>
                  <Button
                    size="sm"
                    variant={u.active ? 'outline-warning' : 'outline-success'}
                    className="rounded-pill px-3"
                    onClick={() => onToggleActive(u)}
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
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="rounded-pill px-3"
                    onClick={() => onPassword(u)}
                    title="Changer mot de passe"
                    style={{ borderColor: '#10b981', color: '#10b981' }}
                    onMouseEnter={(e) => { e.target.style.backgroundColor = '#10b981'; e.target.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#10b981'; }}
                  >
                    <FaKey size={12} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    className="rounded-pill px-3"
                    onClick={() => onDelete(u)}
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
      {users.length === 0 && (
        <p className="text-center text-muted py-4">Aucun utilisateur dans cette catégorie.</p>
      )}
    </div>
  );
}

export default UserManagement;