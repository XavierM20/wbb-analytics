import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SessionOption from './SessionOption';
import MainLayout from '../../layouts/MainLayout'; // Ensure MainLayout is used if needed
import './Home.css';

const HomePage = () => { 
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="home-page-container">
      <div className="home-button-container">
        <button onClick={() => navigate('/practice')} className="button">
            PRACTICE
        </button>
        <button onClick={() => navigate('/game')} className="button">
            GAME
        </button>
        <button onClick={() => navigate('/playerstats')} className="button">
            PLAYER STATS
        </button>
        <button onClick={() => navigate('/teamstats')} className="button">
            TEAM STATS
        </button>
        <button onClick={() => navigate('/Settings')} className="button">
            SETTINGS
        </button>
      </div>
      <SessionOption isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default HomePage;
