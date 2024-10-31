import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import './Home.css';

const SessionOption = ({ isOpen, onClose }) => {
    let navigate = useNavigate();
    // Function to navigate to the session type
    const gotoSession = (sessionType) => {
        onClose(); // Close the modal first
        if (sessionType ==='practice') {
            navigate('/practice');
        } else if (sessionType ==='game') {
            navigate('/game'); 
        }
    };
    
    if(!isOpen) return null;

    return (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-button" onClick={onClose}>X</button>
            <h2>Select Session Type</h2>
            <div>
              <button className="Linkish-Button" onClick={() => gotoSession('practice')}>Create Practice</button>
              <button className="Linkish-Button" onClick={() => gotoSession('game')}>Create Game</button>
            </div>
          </div>
        </div>
      );
    };
    
    export default SessionOption;
