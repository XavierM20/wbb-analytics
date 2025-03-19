import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/AuthProvider';
import axios from 'axios';
import './CreateSeason.css';

function CreateSeason() {
  const [year, setYear] = useState('');
  const [players, setPlayers] = useState([]);
  const [activePlayer, setActivePlayer] = useState({ name: '', jersey_number: '', position: 'PG' });
  const [editIndex, setEditIndex] = useState(-1);
  const [jerseyError, setJerseyError] = useState('');
  const [previousSeasonPlayers, setPreviousSeasonPlayers] = useState([]);
  const serverUrl = process.env.REACT_APP_SERVER_URL;

  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role || 'Player';

  useEffect(() => {
    if (year.length === 9) {
      const [startYear, endYear] = year.split('-');
      axios.get(`${serverUrl}/api/seasons/endYear/${endYear}/${sessionStorage.getItem('schoolID')}`)
        .then(({ data }) => fetchPlayers(data.players))
        .catch(() => setPreviousSeasonPlayers([]));
    } else {
      setPlayers([]);
    }
  }, [year, serverUrl]);

  const fetchPlayers = (playerIds) => {
    Promise.all(playerIds.map(id => axios.get(`${serverUrl}/api/players/${id}`).then(res => res.data)))
      .then(setPlayers);
  };

  const handleYearChange = (event) => {
    let input = event.target.value;
    const yearFormatRegex = /^(\d{0,4})-?(\d{0,4})$/;
    const match = input.match(yearFormatRegex);

    if (match) {
      let [startYear, endYear] = match.slice(1);
      if (startYear.length === 4 && year.length === 3) startYear += '-';
      if (startYear.length === 4 && endYear) endYear = (parseInt(startYear) + 1).toString().slice(0, 4);
      setYear(startYear + (endYear ? '-' + endYear : ''));
    } else {
      setYear('');
    }
  };

  const handlePlayerChange = (field, value) => {
    setActivePlayer(prev => ({ ...prev, [field]: value }));
    setJerseyError('');
  };

  const addOrUpdatePlayer = () => {
    if (!activePlayer.name.trim() || !activePlayer.jersey_number.trim()) {
      setJerseyError('Player name and jersey number cannot be empty.');
      return;
    }

    const jerseyNumberInt = parseInt(activePlayer.jersey_number, 10);
    if (isNaN(jerseyNumberInt) || jerseyNumberInt < 0 || players.some((p, idx) => p.jersey_number === jerseyNumberInt && idx !== editIndex)) {
      setJerseyError('Invalid or duplicate jersey number.');
      return;
    }

    const updatedPlayers = [...players];
    if (editIndex >= 0) updatedPlayers[editIndex] = { ...activePlayer, jersey_number: jerseyNumberInt };
    else updatedPlayers.push({ ...activePlayer, jersey_number: jerseyNumberInt });

    setPlayers(updatedPlayers);
    setActivePlayer({ name: '', jersey_number: '', position: 'PG' });
    setEditIndex(-1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const newPlayers = players.filter(p => !p._id);
    const existingPlayers = players.filter(p => p._id);
    
    try {
      const createdPlayers = await Promise.all(newPlayers.map(player => 
        axios.post(`${serverUrl}/api/players`, player).then(res => res.data)
      ));
      
      const allPlayers = [...existingPlayers, ...createdPlayers];
      const endYear = year.split('-')[1];
      const { data: existingSeason } = await axios.get(`${serverUrl}/api/seasons/endYear/${endYear}/${sessionStorage.getItem('schoolID')}`);

      if (existingSeason.message !== 'Season not found for the given year') {
        await axios.patch(`${serverUrl}/api/seasons/${existingSeason._id}/players`, { players: allPlayers.map(p => p._id) });
      } else {
        await axios.post(`${serverUrl}/api/seasons`, { year, players: allPlayers.map(p => p._id), schoolID: sessionStorage.getItem('schoolID') });
      }
      
      setYear('');
      setPlayers([]);
      setActivePlayer({ name: '', jersey_number: '', position: 'PG' });
      setEditIndex(-1);
    } catch (error) {
      console.error('Error handling submission:', error);
    }
  };

  return (
    <div className="create-season">
      <button className="btn-home top-right-button" onClick={() => navigate('/homepage')}>Home</button>
      {userRole !== 'Player' ? (
        <div className="form-container-season">
          <form onSubmit={handleSubmit}>
            <label>Season Year:</label>
            <input type="text" value={year} onChange={handleYearChange} placeholder="2023-2024" />
            <label>Player Name:</label>
            <input type="text" list="previous-players" value={activePlayer.name} onChange={(e) => handlePlayerChange('name', e.target.value)} />
            <datalist id="previous-players">
              {previousSeasonPlayers.map((p, i) => <option key={i} value={p.name} />)}
            </datalist>
            <label>Jersey Number:</label>
            <input type="number" value={activePlayer.jersey_number} onChange={(e) => handlePlayerChange('jersey_number', e.target.value)} />
            {jerseyError && <div className="jersey-error">{jerseyError}</div>}
            <label>Position:</label>
            <select value={activePlayer.position} onChange={(e) => handlePlayerChange('position', e.target.value)}>
              <option value="PG">PG</option>
              <option value="SG">SG</option>
              <option value="SF">SF</option>
              <option value="PF">PF</option>
              <option value="C">C</option>
            </select>
            <button type="button" onClick={addOrUpdatePlayer}>{editIndex >= 0 ? 'Update' : 'Add'} Player</button>
            <button type="submit">Create/Edit Season</button>
          </form>
        </div>
      ) : (
        <div className="access-denied"><h2>Access Denied</h2><p>You do not have permission to create or edit a season.</p></div>
      )}
    </div>
  );
}

export default CreateSeason;
