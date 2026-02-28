import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaComments,
  FaMoneyBillWave,
  FaUsers,
  FaHistory,
  FaCog,
  FaImage
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  return (
    <div
      style={{
        width: '250px',
        backgroundColor: '#343a40',
        minHeight: 'calc(100vh - 56px)',
        paddingTop: '1rem',
        flexShrink: 0
      }}
    >
      <Nav className="flex-column">
        <Nav.Link as={Link} to="/" className={`text-light ${isActive('/')}`}>
          <FaTachometerAlt className="me-2" /> Dashboard
        </Nav.Link>
        <Nav.Link as={Link} to="/events" className={`text-light ${isActive('/events')}`}>
          <FaCalendarAlt className="me-2" /> Événements
        </Nav.Link>
        <Nav.Link as={Link} to="/comments" className={`text-light ${isActive('/comments')}`}>
          <FaComments className="me-2" /> Commentaires
        </Nav.Link>
        <Nav.Link as={Link} to="/transactions" className={`text-light ${isActive('/transactions')}`}>
          <FaMoneyBillWave className="me-2" /> Transactions
        </Nav.Link>
        <Nav.Link as={Link} to="/media" className={`text-light ${isActive('/media')}`}>
          <FaImage className="me-2" /> Médias
        </Nav.Link>
        {user?.role === 'superadmin' && (
          <>
            <Nav.Link as={Link} to="/users" className={`text-light ${isActive('/users')}`}>
              <FaUsers className="me-2" /> Utilisateurs
            </Nav.Link>
            <Nav.Link as={Link} to="/logs" className={`text-light ${isActive('/logs')}`}>
              <FaHistory className="me-2" /> Journal d'audit
            </Nav.Link>
          </>
        )}
        <Nav.Link as={Link} to="/settings" className={`text-light ${isActive('/settings')}`}>
          <FaCog className="me-2" /> Paramètres
        </Nav.Link>
      </Nav>
    </div>
  );
}

export default Sidebar;