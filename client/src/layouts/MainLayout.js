import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import './MainLayout.css';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [practice, setPractice] = useState(null);
  const isDrillPage = location.pathname.includes('/drill');
  const serverUrl = process.env.REACT_APP_SERVER_URL;

  useEffect(() => {
    const practiceID = searchParams.get('PracticeID');
    if (practiceID && isDrillPage) {
      fetch(`${serverUrl}/api/practices/withDrills/${practiceID}`)
        .then(response => response.json())
        .then(data => setPractice(data))
        .catch(error => console.error('Failed to fetch practice data:', error));
    }
  }, [searchParams, isDrillPage, serverUrl]);

  const handleDrillChange = (event) => {
    const newDrillID = event.target.value;
    console.log('Selected Drill:', newDrillID);
    // Update the URL with the new DrillID
    navigate(`${location.pathname}?PracticeID=${searchParams.get('PracticeID')}&DrillID=${newDrillID}`, { replace: true });
  };

  const renderDrillOptions = () => {
    if (!practice) return <div>Loading or no practice data available...</div>;
    const currentDrillID = searchParams.get('DrillID');
    return (
        <div className="center-group">
            <div className="practice-date">Date: {new Date(practice.date).toLocaleDateString()}</div>
            <select className="drill-select" value={currentDrillID} onChange={handleDrillChange}>
                {practice.drills.map(drill => (
                    <option key={drill._id} value={drill._id}>{drill.name}</option>
                ))}
            </select>
        </div>
    );
  };

  return (
    <div className="main-layout">
      <div className="page-content">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
