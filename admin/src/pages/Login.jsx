import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card } from 'react-bootstrap';
import { FaSignInAlt, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '2rem' }}>
      <Container style={{ maxWidth: '450px' }}>
        <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
          <Card.Body className="p-5">
            {/* En-tête avec icône */}
            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: '80px', height: '80px', backgroundColor: 'rgba(16,185,129,0.1)' }}>
                <FaSignInAlt size={32} style={{ color: '#10b981' }} />
              </div>
              <h2 className="fw-bold" style={{ color: '#0f172a' }}>Administration</h2>
              <p className="text-muted">Connectez-vous à votre espace</p>
            </div>

            <Form onSubmit={handleSubmit}>
              {/* Champ Email */}
              <Form.Group className="mb-4" controlId="email">
                <Form.Label className="fw-semibold small text-muted">Adresse email</Form.Label>
                <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                  <FaEnvelope className="me-2" style={{ color: '#10b981' }} />
                  <Form.Control
                    type="email"
                    placeholder="admin@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-0 bg-transparent"
                    style={{ boxShadow: 'none' }}
                  />
                </div>
              </Form.Group>

              {/* Champ Mot de passe */}
              <Form.Group className="mb-4" controlId="password">
                <Form.Label className="fw-semibold small text-muted">Mot de passe</Form.Label>
                <div className="d-flex align-items-center border rounded-3 p-2 bg-light">
                  <FaLock className="me-2" style={{ color: '#10b981' }} />
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-0 bg-transparent"
                    style={{ boxShadow: 'none' }}
                  />
                  <Button
                    variant="link"
                    onClick={togglePasswordVisibility}
                    className="p-0 border-0 bg-transparent text-muted"
                    style={{ minWidth: '30px' }}
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </Button>
                </div>
              </Form.Group>

              {/* Lien mot de passe oublié (optionnel) */}
              <div className="text-end mb-4">
                <a href="/forgot-password" className="text-decoration-none small" style={{ color: '#10b981' }}>
                  Mot de passe oublié ?
                </a>
              </div>

              {/* Bouton de connexion */}
              <Button
                type="submit"
                className="w-100 py-3 rounded-3 fw-semibold d-flex align-items-center justify-content-center border-0"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #0f9d6b 100%)', color: 'white' }}
              >
                <FaSignInAlt className="me-2" /> Se connecter
              </Button>
            </Form>

            {/* Lien retour au site */}
            <div className="text-center mt-4">
              <a href="/" className="text-decoration-none small" style={{ color: '#10b981' }}>
                ← Retour au site
              </a>
            </div>
          </Card.Body>
        </Card>

        <p className="text-center text-muted small mt-3">
          🔒 Accès réservé aux administrateurs
        </p>
      </Container>
    </div>
  );
}

export default Login;