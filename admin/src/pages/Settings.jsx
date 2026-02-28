import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Container, Card, Form, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';

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

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container>
      <h2 className="mb-4">Paramètres de la plateforme</h2>
      <Row>
        {settings.map(setting => (
          <Col md={6} key={setting.key} className="mb-3">
            <Card>
              <Card.Body>
                <Card.Title>{setting.key.replace(/_/g, ' ')}</Card.Title>
                <Card.Text className="text-muted small">{setting.description}</Card.Text>
                <Form.Group>
                  {setting.type === 'boolean' ? (
                    <Form.Check 
                      type="checkbox"
                      checked={setting.value === 'true'}
                      onChange={(e) => handleChange(setting.key, e.target.checked.toString())}
                    />
                  ) : setting.type === 'json' ? (
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={setting.value}
                      onChange={(e) => handleChange(setting.key, e.target.value)}
                    />
                  ) : (
                    <Form.Control
                      type={setting.type === 'number' ? 'number' : 'text'}
                      value={setting.value}
                      onChange={(e) => handleChange(setting.key, e.target.value)}
                    />
                  )}
                </Form.Group>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleSave(setting.key)}
                  disabled={saving}
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default Settings;