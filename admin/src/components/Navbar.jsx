import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Form, FormControl, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { FaBell, FaSearch } from 'react-icons/fa';
import Avatar from 'react-avatar';

function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="light" expand="lg" className="navbar-custom shadow-sm">
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-primary">
          Event Plan Admin
        </Navbar.Brand>
        <Form className="d-flex ms-auto me-3" style={{ maxWidth: '300px' }}>
          <FormControl
            type="search"
            placeholder="Rechercher..."
            className="rounded-pill border border-secondary bg-white"
            style={{
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              paddingLeft: '1rem'
            }}
          />
          {/* <FaSearch className="text-muted ms-2 align-self-center" /> */}
        </Form>
        <Nav className="align-items-center">
          {/* Notifications avec badge aligné */}
          <Nav.Link className="position-relative me-3 p-0">
            <FaBell size={20} />
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
              3
            </span>
          </Nav.Link>

          {/* Avatar avec dropdown */}
          <NavDropdown
            title={
              <Avatar
                name={user?.email}
                size="35"
                round={true}
                textSizeRatio={2}
                color="#3b82f6"
                fgColor="white"
              />
            }
            id="user-dropdown"
            align="end"
            className="no-caret"
          >
            <NavDropdown.Item as={Link} to="/profile">Profil</NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item onClick={handleLogout}>Déconnexion</NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Container>
    </Navbar>
  );
}

export default Navigation;