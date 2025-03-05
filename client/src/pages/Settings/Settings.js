import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/AuthProvider';
import './Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    const auth = useAuth();

    const handleExport = (type) => {
        try {
            console.log(`Exporting ${type}...`);
        } catch (err) {
            console.error(`Error exporting ${type}:`, err);
        }
    };

    return (
        <div className="settings-page-container">
            <button className='btn-home top-right-button' onClick={() => navigate('/homepage')}>Home</button>
            <div className="settings-button-container">
                <h1>Settings</h1>
                <div className="button-row">
                    <div className="export-buttons">
                        <button className="btn btn-JSON" onClick={() => handleExport('JSON')}>Export JSON</button>
                        <button className="btn btn-CSV" onClick={() => handleExport('CSV')}>Export CSV</button>
                    </div>
                    {auth.role === 'Coach' && (
                        <>
                            <button className="btn season" onClick={() => navigate('/season')}>Create New Season</button>
                            <button className="btn customize-team-colors" onClick={() => navigate('/customize')}>Customize Team Colors</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
