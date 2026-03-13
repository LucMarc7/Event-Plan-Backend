import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Image, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';
import { toast } from 'react-toastify';
import {
  FaUser, FaEnvelope, FaPhone, FaCity, FaGlobe, FaBirthdayCake,
  FaKey, FaLock, FaEye, FaEyeSlash, FaEdit, FaSave, FaTimes,
  FaIdCard, FaTrashAlt, FaUndoAlt
} from 'react-icons/fa';

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      setRemoveAvatar(false);
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
      setRemoveAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    if (window.confirm('Voulez-vous vraiment supprimer votre photo de profil ?')) {
      setRemoveAvatar(true);
      setAvatarFile(null);
      setAvatarPreview(null);
      document.getElementById('avatar-input').value = '';
    }
  };

  const handleCancelRemove = () => {
    setRemoveAvatar(false);
    setAvatarPreview(profile?.avatar || null);
    setAvatarFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', profile.name || '');
    formData.append('phone', profile.phone || '');
    formData.append('city', profile.city || '');
    formData.append('country', profile.country || '');
    formData.append('birth_date', profile.birth_date || '');

    if (removeAvatar) {
      formData.append('keepImage', 'false');
    } else if (avatarFile) {
      formData.append('avatar', avatarFile);
    } else {
      formData.append('keepImage', 'true');
    }

    try {
      const response = await API.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(response.data);
      toast.success('Profil mis à jour');
      setEditMode(false);
      setRemoveAvatar(false);
      setAvatarFile(null);
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

  const getInitials = () => {
    if (!profile) return '';
    const name = profile.name || '';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (name) return name[0].toUpperCase();
    return profile.email?.[0].toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger" className="rounded-4 shadow-sm text-center py-5">{error}</Alert>
      </Container>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <Container fluid>
        <div className="d-flex align-items-center mb-4">
          <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
            <FaIdCard className="text-primary" size={28} />
          </div>
          <div>
            <h2 className="fw-bold" style={{ color: 'var(--dark)' }}>Mon profil</h2>
            <p className="text-muted mb-0">Gérez vos informations personnelles et votre mot de passe</p>
          </div>
        </div>

        <Row className="g-4">
          <Col md={4}>
            <Card className="border-0 shadow-sm rounded-4 text-center p-4 stat-card">
              <div className="position-relative">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    roundedCircle
                    width="150"
                    height="150"
                    style={{ objectFit: 'cover', margin: '0 auto', border: '3px solid var(--primary)' }}
                  />
                ) : (
                  <div style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    color: 'white',
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    border: '3px solid white',
                    boxShadow: 'var(--card-shadow)'
                  }}>
                    {getInitials()}
                  </div>
                )}
                {editMode && avatarPreview && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="position-absolute rounded-circle"
                    style={{ top: '10px', right: 'calc(50% - 75px)' }}
                    onClick={handleRemoveAvatar}
                    title="Supprimer l'avatar"
                  >
                    <FaTrashAlt />
                  </Button>
                )}
                {editMode && removeAvatar && (
                  <Button
                    variant="warning"
                    size="sm"
                    className="position-absolute rounded-circle"
                    style={{ top: '10px', right: 'calc(50% - 75px)' }}
                    onClick={handleCancelRemove}
                    title="Annuler la suppression"
                  >
                    <FaUndoAlt />
                  </Button>
                )}
              </div>
              <h4 className="mt-3 fw-bold">{profile.name || 'Nom non renseigné'}</h4>
              <p className="text-muted">{profile.email}</p>
              <p className="small text-muted">
                <FaUser className="me-1" style={{ color: 'var(--primary)' }} />
                Membre depuis le {new Date(profile.created_at).toLocaleDateString('fr-FR')}
              </p>
              {!editMode && (
                <Button
                  variant="primary"
                  className="rounded-pill px-4 py-2 fw-semibold btn-custom btn-custom-primary"
                  onClick={() => setEditMode(true)}
                >
                  <FaEdit className="me-2" /> Modifier le profil
                </Button>
              )}
            </Card>
          </Col>

          <Col md={8}>
            {editMode ? (
              <Card className="border-0 shadow-sm rounded-4 p-4 stat-card">
                <h4 className="fw-bold mb-4">Modifier mes informations</h4>
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold small text-muted">Nom complet</Form.Label>
                        <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                          <FaUser className="me-2" style={{ color: 'var(--primary)' }} />
                          <Form.Control
                            type="text"
                            name="name"
                            value={profile.name || ''}
                            onChange={handleInputChange}
                            className="border-0 bg-transparent"
                            style={{ boxShadow: 'none' }}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold small text-muted">Email</Form.Label>
                        <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                          <FaEnvelope className="me-2" style={{ color: 'var(--primary)' }} />
                          <Form.Control
                            type="email"
                            value={profile.email}
                            disabled
                            className="border-0 bg-transparent text-muted"
                            style={{ boxShadow: 'none' }}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold small text-muted">Téléphone</Form.Label>
                        <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                          <FaPhone className="me-2" style={{ color: 'var(--primary)' }} />
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={profile.phone || ''}
                            onChange={handleInputChange}
                            className="border-0 bg-transparent"
                            style={{ boxShadow: 'none' }}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold small text-muted">Date de naissance</Form.Label>
                        <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                          <FaBirthdayCake className="me-2" style={{ color: 'var(--primary)' }} />
                          <Form.Control
                            type="date"
                            name="birth_date"
                            value={profile.birth_date || ''}
                            onChange={handleInputChange}
                            className="border-0 bg-transparent"
                            style={{ boxShadow: 'none' }}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold small text-muted">Ville</Form.Label>
                        <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                          <FaCity className="me-2" style={{ color: 'var(--primary)' }} />
                          <Form.Control
                            type="text"
                            name="city"
                            value={profile.city || ''}
                            onChange={handleInputChange}
                            className="border-0 bg-transparent"
                            style={{ boxShadow: 'none' }}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold small text-muted">Pays</Form.Label>
                        <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                          <FaGlobe className="me-2" style={{ color: 'var(--primary)' }} />
                          <Form.Control
                            type="text"
                            name="country"
                            value={profile.country || ''}
                            onChange={handleInputChange}
                            className="border-0 bg-transparent"
                            style={{ boxShadow: 'none' }}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold small text-muted">Photo de profil</Form.Label>
                    <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                      <Form.Control
                        id="avatar-input"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="border-0 bg-transparent"
                        style={{ boxShadow: 'none' }}
                      />
                    </div>
                    <Form.Text className="text-muted">
                      Formats acceptés: JPEG, PNG, GIF, WEBP. Max 10 Mo.
                    </Form.Text>
                  </Form.Group>

                  <div className="d-flex gap-2 flex-wrap">
                    <Button
                      variant="primary"
                      type="submit"
                      className="rounded-pill px-4 py-2 fw-semibold btn-custom btn-custom-primary"
                    >
                      <FaSave className="me-2" /> Enregistrer
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditMode(false);
                        setRemoveAvatar(false);
                        setAvatarPreview(profile?.avatar || null);
                        setAvatarFile(null);
                      }}
                      className="rounded-pill px-4 py-2 fw-semibold"
                      style={{ backgroundColor: 'var(--secondary)', borderColor: 'var(--secondary)', color: '#fff' }}
                    >
                      <FaTimes className="me-2" /> Annuler
                    </Button>
                  </div>
                </Form>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm rounded-4 p-4 stat-card">
                <h4 className="fw-bold mb-4">Informations personnelles</h4>
                <Row>
                  <Col sm={6}>
                    <p className="mb-3">
                      <FaUser className="me-2 text-primary" style={{ width: '20px' }} />
                      <strong>Nom :</strong> {profile.name || '-'}
                    </p>
                    <p className="mb-3">
                      <FaEnvelope className="me-2 text-primary" style={{ width: '20px' }} />
                      <strong>Email :</strong> {profile.email}
                    </p>
                    <p className="mb-3">
                      <FaPhone className="me-2 text-primary" style={{ width: '20px' }} />
                      <strong>Téléphone :</strong> {profile.phone || '-'}
                    </p>
                    <p className="mb-3">
                      <FaCity className="me-2 text-primary" style={{ width: '20px' }} />
                      <strong>Ville :</strong> {profile.city || '-'}
                    </p>
                    <p className="mb-3">
                      <FaGlobe className="me-2 text-primary" style={{ width: '20px' }} />
                      <strong>Pays :</strong> {profile.country || '-'}
                    </p>
                    <p className="mb-3">
                      <FaBirthdayCake className="me-2 text-primary" style={{ width: '20px' }} />
                      <strong>Date de naissance :</strong> {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  </Col>
                </Row>
              </Card>
            )}
          </Col>
        </Row>

        <Row className="mt-4">
          <Col md={{ span: 8, offset: 4 }}>
            <Card className="border-0 shadow-sm rounded-4 p-4 stat-card">
              <h4 className="fw-bold mb-4">Changer le mot de passe</h4>
              <Form onSubmit={handlePasswordChange}>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold small text-muted">Mot de passe actuel</Form.Label>
                      <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                        <FaLock className="me-2" style={{ color: 'var(--primary)' }} />
                        <Form.Control
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          required
                          className="border-0 bg-transparent"
                          style={{ boxShadow: 'none' }}
                        />
                        <Button
                          variant="link"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="p-0 border-0 bg-transparent text-muted"
                          style={{ minWidth: '30px' }}
                        >
                          {showCurrentPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </Button>
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold small text-muted">Nouveau mot de passe</Form.Label>
                      <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                        <FaLock className="me-2" style={{ color: 'var(--primary)' }} />
                        <Form.Control
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          required
                          className="border-0 bg-transparent"
                          style={{ boxShadow: 'none' }}
                        />
                        <Button
                          variant="link"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="p-0 border-0 bg-transparent text-muted"
                          style={{ minWidth: '30px' }}
                        >
                          {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </Button>
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold small text-muted">Confirmer</Form.Label>
                      <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                        <FaLock className="me-2" style={{ color: 'var(--primary)' }} />
                        <Form.Control
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          required
                          className="border-0 bg-transparent"
                          style={{ boxShadow: 'none' }}
                        />
                        <Button
                          variant="link"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="p-0 border-0 bg-transparent text-muted"
                          style={{ minWidth: '30px' }}
                        >
                          {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </Button>
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                {passwordError && <Alert variant="danger" className="rounded-3 py-2 mt-2">{passwordError}</Alert>}
                {passwordSuccess && <Alert variant="success" className="rounded-3 py-2 mt-2">{passwordSuccess}</Alert>}

                <Button
                  variant="primary"
                  type="submit"
                  className="rounded-pill px-4 py-2 fw-semibold btn-custom btn-custom-primary mt-3"
                >
                  <FaKey className="me-2" /> Mettre à jour le mot de passe
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default ProfilePage;