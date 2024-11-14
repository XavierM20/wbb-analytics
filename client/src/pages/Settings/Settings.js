import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/AuthProvider';
import Register from './Register.js';
import './Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [registration, setRegistration] = useState(false);
    const auth = useAuth();

    const handleExport = (type) => {
        try {
            if (type === 'JSON') {
                // Add logic to export JSON
                console.log('Exporting JSON...');
            } else if (type === 'CSV') {
                // Add logic to export CSV
                console.log('Exporting CSV...');
            }
        } catch (err) {
            setError(`Error exporting ${type}. Please try again.`);
        }
    };

    return (
        <div className="settings-page-container">
            <div className="settings-button-container">
                <h1>Settings</h1>
                <div className="button-row">
                {sessionStorage.getItem('site') === 'Admin' && (
                    <button className="btn Register-btn" onClick={() => { setRegistration(true);}}>
                        Create Registration Key
                    </button>
                )}
                {registration && (
                    <Register isOpen={registration} onClose={() => setRegistration(false)} />
                )}
                    <div className="export-buttons">
                        <button className="btn btn-JSON" onClick={() => handleExport('JSON')}>
                            Export JSON
                        </button>
                        <button className="btn btn-CSV" onClick={() => handleExport('CSV')}>
                            Export CSV
                        </button>
                    </div>
                    <button className="btn Sign-out" onClick={() => { auth.logOut();}} to="/">Sign Out</button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
