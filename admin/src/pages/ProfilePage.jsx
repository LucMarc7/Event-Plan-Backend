import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Image, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';
import { toast } from 'react-toastify';

function ProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await API.get('/users/profile');
      setProfile(response.data);
      setAvatarPreview(response.data.avatar);
    } catch (err) {
      setError('Erreur de chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', profile.name || '');
    formData.append('phone', profile.phone || '');
    formData.append('city', profile.city || '');
    formData.append('country', profile.country || '');
    formData.append('birth_date', profile.birth_date || '');
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    try {
      const response = await API.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(response.data);
      toast.success('Profil mis à jour');
      setEditMode(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      await API.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordSuccess('Mot de passe modifié avec succès');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Erreur');
    }
  };

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container className="mt-4">
      <h2>Mon profil</h2>
      <Row>
        <Col md={4}>
          <Card>
            <Card.Body className="text-center">
              <Image
                src={avatarPreview || 'https://via.placeholder.com/150'}
                roundedCircle
                width="150"
                height="150"
                style={{ objectFit: 'cover' }}
              />
              <h4 className="mt-3">{profile.name || 'Nom non renseigné'}</h4>
              <p>{profile.email}</p>
              {!editMode && (
                <Button variant="primary" onClick={() => setEditMode(true)}>
                  Modifier le profil
                </Button>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          {editMode ? (
            <Card>
              <Card.Body>
                <h4>Modifier mes informations</h4>
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Nom complet</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={profile.name || ''}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          value={profile.email}
                          disabled
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Téléphone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={profile.phone || ''}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Date de naissance</Form.Label>
                        <Form.Control
                          type="date"
                          name="birth_date"
                          value={profile.birth_date || ''}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Ville</Form.Label>
                        <Form.Control
                          type="text"
                          name="city"
                          value={profile.city || ''}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Pays</Form.Label>
                        <Form.Control
                          type="text"
                          name="country"
                          value={profile.country || ''}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>Photo de profil</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit">
                    Enregistrer
                  </Button>
                  <Button variant="secondary" className="ms-2" onClick={() => setEditMode(false)}>
                    Annuler
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body>
                <h4>Informations personnelles</h4>
                <p><strong>Nom :</strong> {profile.name || '-'}</p>
                <p><strong>Email :</strong> {profile.email}</p>
                <p><strong>Téléphone :</strong> {profile.phone || '-'}</p>
                <p><strong>Ville :</strong> {profile.city || '-'}</p>
                <p><strong>Pays :</strong> {profile.country || '-'}</p>
                <p><strong>Date de naissance :</strong> {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString() : '-'}</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
      <Row className="mt-4">
        <Col md={{ span: 6, offset: 4 }}>
          <Card>
            <Card.Body>
              <h4>Changer le mot de passe</h4>
              <Form onSubmit={handlePasswordChange}>
                <Form.Group className="mb-3">
                  <Form.Label>Mot de passe actuel</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Nouveau mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Confirmer le mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                  />
                </Form.Group>
                {passwordError && <Alert variant="danger">{passwordError}</Alert>}
                {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}
                <Button variant="primary" type="submit">
                  Mettre à jour le mot de passe
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ProfilePage;