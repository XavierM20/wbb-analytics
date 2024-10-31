import React, { useState } from 'react';
import { slide as Menu } from 'react-burger-menu';
import { Link } from 'react-router-dom';
import './HamburgerMenu.css'; // Ensure your CSS file is correctly imported
import logoPath from '../../images/nESTlogo.png'; // Update this path to where your logo is stored
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from '../../hooks/AuthProvider';
import Register from './Register.js';

export default props => {
  const [registration, setRegistration] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // State to manage menu open/close
  const auth = useAuth();

  // Function to close menu
  const closeMenu = () => setIsOpen(false);

  return (
    <Menu isOpen={isOpen} onStateChange={({ isOpen }) => setIsOpen(isOpen)}>
      <img src={logoPath} alt="Logo" className="hamburger-logo" />
      <a className="menu-item" href="/homepage" onClick={closeMenu}>
        Home
      </a>
      <Link className="menu-item" to="/practice" onClick={closeMenu}>
        Create Practice
      </Link>
      <Link className="menu-item" to="/game" onClick={closeMenu}>
        Create Game
      </Link>
      <Link className="menu-item" to="/teamstats" onClick={closeMenu}>
        Team Stats
      </Link>
      <Link className="menu-item" to="/playerstats" onClick={closeMenu}>
        Player Stats
      </Link>
      <Link className="menu-item" to="/export" onClick={closeMenu}>
        Export
      </Link>
      {sessionStorage.getItem('site') === 'Admin' && (
        <button className="menu-item-button" onClick={() => { setRegistration(true); closeMenu(); }}>
          Create Registration Key
        </button>
      )}
      {registration && (
        <Register isOpen={registration} onClose={() => setRegistration(false)} />
      )}
      <Link className="menu-item" onClick={() => { auth.logOut(); closeMenu(); }} to="/">
        Sign Out
      </Link>
    </Menu>
  );
};
