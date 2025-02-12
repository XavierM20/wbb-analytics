import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SessionOption from './SessionOption';
import MainLayout from '../../layouts/MainLayout'; // Ensure MainLayout is used if needed
import './Home.css';
import { useAuth } from '../../hooks/AuthProvider';

const HomePage = () => { 
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const auth = useAuth();

  return (
    <div className="home-page-container">
      <div className="home-button-container">
        <button className='sign-out'onClick={() => { auth.logOut();}} to='/'>SIGN OUT</button>
        <button onClick={() => navigate('/practice')} className="button-practice">PRACTICE</button>
        <button onClick={() => navigate('/game')} className="button-game">GAME</button>
        <button onClick={() => navigate('/playerstats')} className="button-playerStats">PLAYER STATS</button>
        <button onClick={() => navigate('/teamstats')} className="button-teamStats">TEAM STATS</button>
        <button onClick={() => navigate('/Settings')} className="button-settings">SETTINGS</button>
      </div>
      <SessionOption isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default HomePage;
