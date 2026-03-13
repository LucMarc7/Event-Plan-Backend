import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Container, Card, Form, Button, Spinner, Alert, Row, Col, Badge, Accordion } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaSave, FaGlobe, FaCreditCard, FaBell, FaPalette, FaShieldAlt, FaEnvelope, FaChartLine } from 'react-icons/fa';

function Settings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await API.get('/admin/settings');
      setSettings(response.data);
    } catch (err) {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = async (key) => {
    const setting = settings.find(s => s.key === key);
    if (!setting) return;
    
    setSaving(true);
    try {
      await API.put(`/admin/settings/${key}`, { value: setting.value });
      toast.success('Paramètre mis à jour');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Sauvegarder tous les paramètres modifiés (on envoie un par un ou un bulk)
      for (const setting of settings) {
        await API.put(`/admin/settings/${setting.key}`, { value: setting.value });
      }
      toast.success('Tous les paramètres ont été mis à jour');
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde globale');
    } finally {
      setSaving(false);
    }
  };

  // Catégorisation des paramètres (exemple)
  const categories = {
    general: { icon: <FaGlobe />, title: 'Général', keys: ['site_name', 'site_description', 'maintenance_mode'] },
    payment: { icon: <FaCreditCard />, title: 'Paiement', keys: ['payment_methods', 'commission_standard', 'commission_vip', 'min_payment_amount'] },
    notifications: { icon: <FaBell />, title: 'Notifications', keys: ['email_notifications', 'sms_notifications', 'welcome_email'] },
    appearance: { icon: <FaPalette />, title: 'Apparence', keys: ['primary_color', 'logo_url', 'favicon_url'] },
    security: { icon: <FaShieldAlt />, title: 'Sécurité', keys: ['max_login_attempts', 'session_timeout'] },
    email: { icon: <FaEnvelope />, title: 'Email', keys: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass'] },
    analytics: { icon: <FaChartLine />, title: 'Analytiques', keys: ['google_analytics_id', 'facebook_pixel_id'] }
  };

  // Grouper les settings par catégorie
  const groupedSettings = {};
  settings.forEach(setting => {
    const found = Object.entries(categories).find(([_, cat]) => cat.keys.includes(setting.key));
    const category = found ? found[0] : 'other';
    if (!groupedSettings[category]) groupedSettings[category] = [];
    groupedSettings[category].push(setting);
  });

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
        <Alert variant="danger" className="rounded-4 shadow-sm">{error}</Alert>
      </Container>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <Container fluid>
        {/* En-tête */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center">
            <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
              <FaSave className="text-primary" size={28} />
            </div>
            <div>
              <h2 className="fw-bold" style={{ color: 'var(--dark)' }}>Paramètres de la plateforme</h2>
              <p className="text-muted mb-0">Configurez tous les aspects de votre application</p>
            </div>
          </div>
          <Button
            variant="primary"
            className="rounded-pill px-4 py-2 fw-semibold btn-custom btn-custom-primary"
            onClick={handleSaveAll}
            disabled={saving}
          >
            {saving ? <Spinner animation="border" size="sm" className="me-2" /> : <FaSave className="me-2" />}
            Tout enregistrer
          </Button>
        </div>

        {/* Cartes par catégorie */}
        <Accordion defaultActiveKey="0" className="mb-4">
          {Object.entries(groupedSettings).map(([category, settingsList], idx) => (
            <Accordion.Item eventKey={idx.toString()} key={category} className="border-0 mb-3 rounded-4 shadow-sm overflow-hidden">
              <Accordion.Header className="bg-white">
                <div className="d-flex align-items-center">
                  <span className="me-2 fs-5" style={{ color: 'var(--primary)' }}>{categories[category]?.icon}</span>
                  <span className="fw-semibold">{categories[category]?.title || 'Autres'}</span>
                  <Badge bg="light" text="dark" className="ms-3 rounded-pill">{settingsList.length}</Badge>
                </div>
              </Accordion.Header>
              <Accordion.Body className="bg-light p-4">
                <Row>
                  {settingsList.map(setting => (
                    <Col md={6} lg={4} key={setting.key} className="mb-3">
                      <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <Card.Title className="fw-semibold fs-6" style={{ color: 'var(--dark)' }}>
                              {setting.key.replace(/_/g, ' ')}
                            </Card.Title>
                            {setting.type && (
                              <Badge bg="secondary" className="rounded-pill" style={{ fontSize: '0.7rem' }}>
                                {setting.type}
                              </Badge>
                            )}
                          </div>
                          {setting.description && (
                            <Card.Text className="text-muted small mb-3">{setting.description}</Card.Text>
                          )}
                          <Form.Group className="mb-3">
                            {setting.type === 'boolean' ? (
                              <div className="d-flex align-items-center">
                                <Form.Check
                                  type="switch"
                                  id={`switch-${setting.key}`}
                                  checked={setting.value === 'true'}
                                  onChange={(e) => handleChange(setting.key, e.target.checked.toString())}
                                  className="me-2"
                                />
                                <Form.Label htmlFor={`switch-${setting.key}`} className="mb-0 small">
                                  {setting.value === 'true' ? 'Activé' : 'Désactivé'}
                                </Form.Label>
                              </div>
                            ) : setting.type === 'json' ? (
                              <Form.Control
                                as="textarea"
                                rows={2}
                                value={setting.value}
                                onChange={(e) => handleChange(setting.key, e.target.value)}
                                className="rounded-3 border-0 bg-light"
                                style={{ fontSize: '0.9rem' }}
                              />
                            ) : setting.type === 'select' ? (
                              <Form.Select
                                value={setting.value}
                                onChange={(e) => handleChange(setting.key, e.target.value)}
                                className="rounded-3 border-0 bg-light"
                              >
                                {setting.options?.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </Form.Select>
                            ) : (
                              <Form.Control
                                type={setting.type === 'number' ? 'number' : 'text'}
                                value={setting.value}
                                onChange={(e) => handleChange(setting.key, e.target.value)}
                                className="rounded-3 border-0 bg-light"
                                style={{ fontSize: '0.9rem' }}
                              />
                            )}
                          </Form.Group>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="rounded-pill px-3 w-100"
                            onClick={() => handleSave(setting.key)}
                            disabled={saving}
                          >
                            <FaSave className="me-2" /> Enregistrer
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </Container>
    </div>
  );
}

export default Settings;