import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSignOut = () => {
        try {
            // Add actual sign-out logic here
            navigate('/login');
        } catch (err) {
            setError('Error signing out. Please try again.');
        }
    };

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
                    <button className="btn Register-btn" type="button">
                        Create Registration Key
                    </button>
                    <div className="export-buttons">
                        <button className="btn btn-JSON" onClick={() => handleExport('JSON')}>Export JSON</button>
                        <button className="btn btn-CSV" onClick={() => handleExport('CSV')}>Export CSV</button>
                    </div>
                    <button className="btn Sign-out" onClick={handleSignOut}>Sign Out</button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
