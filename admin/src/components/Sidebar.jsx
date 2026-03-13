import React, { useState } from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaComments,
  FaMoneyBillWave,
  FaUsers,
  FaHistory,
  FaCog,
  FaImage,
  FaChevronLeft,
  FaChevronRight,
  FaSignOutAlt
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

function Sidebar({ collapsed, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header d-flex align-items-center justify-content-between p-3">
        {!collapsed && <h5 className="text-white fw-bold mb-0">Event Plan</h5>}
        <button onClick={toggleSidebar} className="btn btn-sm btn-outline-light">
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>
      <Nav className="flex-column">
        <Nav.Link as={Link} to="/" className={`nav-link ${isActive('/')}`}>
          <FaTachometerAlt />
          {!collapsed && <span className="ms-2">Dashboard</span>}
        </Nav.Link>
        <Nav.Link as={Link} to="/events" className={`nav-link ${isActive('/events')}`}>
          <FaCalendarAlt />
          {!collapsed && <span className="ms-2">Événements</span>}
        </Nav.Link>
        <Nav.Link as={Link} to="/comments" className={`nav-link ${isActive('/comments')}`}>
          <FaComments />
          {!collapsed && <span className="ms-2">Commentaires</span>}
        </Nav.Link>
        <Nav.Link as={Link} to="/transactions" className={`nav-link ${isActive('/transactions')}`}>
          <FaMoneyBillWave />
          {!collapsed && <span className="ms-2">Transactions</span>}
        </Nav.Link>
        <Nav.Link as={Link} to="/media" className={`nav-link ${isActive('/media')}`}>
          <FaImage />
          {!collapsed && <span className="ms-2">Médias</span>}
        </Nav.Link>
        {user?.role === 'superadmin' && (
          <>
            <Nav.Link as={Link} to="/users" className={`nav-link ${isActive('/users')}`}>
              <FaUsers />
              {!collapsed && <span className="ms-2">Utilisateurs</span>}
            </Nav.Link>
            <Nav.Link as={Link} to="/logs" className={`nav-link ${isActive('/logs')}`}>
              <FaHistory />
              {!collapsed && <span className="ms-2">Journal</span>}
            </Nav.Link>
          </>
        )}
        {/* Séparateur et liens du bas */}
        <div className="mt-auto">
          <hr className="bg-light" />
          <Nav.Link as={Link} to="/settings" className={`nav-link ${isActive('/settings')}`}>
            <FaCog />
            {!collapsed && <span className="ms-2">Paramètres</span>}
          </Nav.Link>
          <Nav.Link onClick={handleLogout} className="nav-link text-danger">
            <FaSignOutAlt />
            {!collapsed && <span className="ms-2">Déconnexion</span>}
          </Nav.Link>
          {!collapsed && (
            <div className="text-muted small text-center py-3">
              © {new Date().getFullYear()} Event Plan
            </div>
          )}
        </div>
      </Nav>
    </div>
  );
}

export default Sidebar;