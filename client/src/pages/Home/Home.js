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
      <button onClick={() => setIsModalOpen(true)} className="link-button new-session-button">
        New Session
      </button>
      <div className="stats-buttons-container">
        <button onClick={() => navigate('/playerstats')} className="link-button">
          Player Stats
        </button>
        <button onClick={() => navigate('/teamstats')} className="link-button">
          Team Stats
        </button>
      </div>
      <SessionOption isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default HomePage;
