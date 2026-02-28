import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import Avatar from 'react-avatar';

function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
      <Container fluid>
        <Navbar.Brand as={Link} to="/">
          <img
            src="/src/assets/images/logo.png"
            height="40"
            className="d-inline-block align-top"
            alt="Event Plan Admin"
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {user && (
              <NavDropdown
                title={
                  <Avatar
                    name={user.email}
                    size="35"
                    round={true}
                    textSizeRatio={2}
                    color="#ff4b4b"
                    fgColor="white"
                  />
                }
                id="user-dropdown"
                align="end"
                className="no-caret"
              >
                <NavDropdown.Item as={Link} to="/profile">Mon profil</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Déconnexion</NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;