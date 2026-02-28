import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Tabs, Tab, Table, Button, Badge, Spinner, Alert, Form, Modal, Row, Col } from 'react-bootstrap';
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaKey, FaUserPlus } from 'react-icons/fa';
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
      // Récupérer les utilisateurs de la plateforme (acheteurs, vendeurs)
      const platformRes = await API.get(`/admin/users?role=buyer,seller&page=${platformPage}&limit=${limit}`);
      // Récupérer les administrateurs (admin, superadmin)
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
    return <Alert variant="danger">Accès réservé au super administrateur.</Alert>;
  }

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h2 className="mb-4">Gestion des utilisateurs</h2>
      <Button variant="success" onClick={() => setShowCreateModal(true)} className="mb-3">
        <FaUserPlus className="me-2" /> Créer un utilisateur
      </Button>

      <Tabs defaultActiveKey="platform" id="user-management-tabs" className="mb-3">
        <Tab eventKey="platform" title={`Utilisateurs plateforme (${platformTotal})`}>
          <UserTable
            users={platformUsers}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            onDelete={handleDeleteUser}
            onPassword={setSelectedUser}
            onShowPassword={() => setShowPasswordModal(true)}
          />
          {/* Pagination pour platformUsers à implémenter si nécessaire */}
        </Tab>
        <Tab eventKey="admins" title={`Administrateurs (${adminTotal})`}>
          <UserTable
            users={adminUsers}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            onDelete={handleDeleteUser}
            onPassword={setSelectedUser}
            onShowPassword={() => setShowPasswordModal(true)}
          />
        </Tab>
      </Tabs>

      {/* Modal d'édition */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Modifier l'utilisateur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nom (optionnel)</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Rôle</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="buyer">Acheteur</option>
                <option value="seller">Vendeur</option>
                <option value="admin">Admin secondaire</option>
                <option value="superadmin">Super Admin</option>
              </Form.Select>
            </Form.Group>
            {formData.role === 'seller' && (
              <Form.Group className="mb-3">
                <Form.Label>Catégorie de vendeur</Form.Label>
                <Form.Select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="">Sélectionnez</option>
                  <option value="organizer">Organisateur</option>
                  <option value="artist">Artiste</option>
                  <option value="enterprise">Entreprise</option>
                  <option value="manager">Manager</option>
                  <option value="coach">Coach</option>
                  <option value="favorite">Favorite</option>
                </Form.Select>
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Compte actif"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleUpdateUser}>Enregistrer</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de création */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Créer un utilisateur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mot de passe *</Form.Label>
              <Form.Control
                type="password"
                value={formData.password || ''}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nom (optionnel)</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Rôle</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="buyer">Acheteur</option>
                <option value="seller">Vendeur</option>
                <option value="admin">Admin secondaire</option>
                <option value="superadmin">Super Admin</option>
              </Form.Select>
            </Form.Group>
            {formData.role === 'seller' && (
              <Form.Group className="mb-3">
                <Form.Label>Catégorie de vendeur</Form.Label>
                <Form.Select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="">Sélectionnez</option>
                  <option value="organizer">Organisateur</option>
                  <option value="artist">Artiste</option>
                  <option value="enterprise">Entreprise</option>
                  <option value="manager">Manager</option>
                  <option value="coach">Coach</option>
                  <option value="favorite">Favorite</option>
                </Form.Select>
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Compte actif"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Annuler</Button>
          <Button variant="success" onClick={handleCreateUser}>Créer</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de changement de mot de passe */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Changer le mot de passe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Nouveau mot de passe</Form.Label>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handlePasswordChange}>Changer</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

// Composant tableau réutilisable
function UserTable({ users, onEdit, onToggleActive, onDelete, onPassword, onShowPassword }) {
  return (
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
              <Badge bg={
                u.role === 'superadmin' ? 'danger' :
                u.role === 'admin' ? 'warning' :
                u.role === 'seller' ? 'info' : 'secondary'
              }>
                {u.role}
              </Badge>
            </td>
            <td>
              <Badge bg={u.active ? 'success' : 'secondary'}>
                {u.active ? 'Actif' : 'Inactif'}
              </Badge>
            </td>
            <td>
              <Button size="sm" variant="info" onClick={() => onEdit(u)} className="me-2">
                <FaEdit />
              </Button>
              <Button size="sm" variant={u.active ? 'warning' : 'success'} onClick={() => onToggleActive(u)} className="me-2">
                {u.active ? <FaToggleOff /> : <FaToggleOn />}
              </Button>
              <Button size="sm" variant="primary" onClick={() => { onPassword(u); onShowPassword(); }} className="me-2">
                <FaKey />
              </Button>
              <Button size="sm" variant="danger" onClick={() => onDelete(u)}>
                <FaTrash />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default UserManagement;