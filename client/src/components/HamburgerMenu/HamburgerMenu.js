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
  const auth = useAuth();


  return (
    <Menu>
      <img src={logoPath} alt="Logo" className="hamburger-logo" />
      <a className="menu-item" href="/homepage">
        Home
      </a>
      <Link className="menu-item" to="/practice">
        Create Practice
      </Link>
      <Link className="menu-item" to="/game">
        Create Game
      </Link>
      <Link className="menu-item" to="/teamstats">
        Team Stats
      </Link>
      <Link className="menu-item" to="/playerstats">
        Player Stats
      </Link>
      <Link className="menu-item" to="/export">
        Export
      </Link>
      {sessionStorage.getItem('site') === 'Admin' && (
        <button className="menu-item-button" onClick={() => setRegistration(true)}>
          Create Registration Key
        </button>
      )}
      {registration && (
        <Register isOpen={registration} onClose={() => setRegistration(false)} />
      )}
      <Link className="menu-item" onClick={() => auth.logOut()} to="/">
        Sign Out
      </Link>
    </Menu>
  );
};
