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
            Practice
        </button>
        <button onClick={() => navigate('/game')} className="button">
            Game
        </button>
        <button onClick={() => navigate('/playerstats')} className="button">
            Player Stats
        </button>
        <button onClick={() => navigate('/teamstats')} className="button">
            Team Stats
        </button>
        <button onClick={() => navigate('/teamstats')} className="button">
            Settings
        </button>
      </div>
      <SessionOption isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default HomePage;
