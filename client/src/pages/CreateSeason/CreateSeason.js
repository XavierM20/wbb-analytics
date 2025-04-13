import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/AuthProvider';
import { ObjectId } from 'bson';
import './CreateSeason.css';
import axios from 'axios';


function CreateSeason() {
  const [year, setYear] = useState('');
  const [players, setPlayers] = useState([]);
  const [activePlayer, setActivePlayer] = useState({ name: '', jersey_number: '', position: 'PG' });
  const [editIndex, setEditIndex] = useState(-1);
  const [jerseyError, setJerseyError] = useState('');
  const [previousSeasonPlayers, setPreviousSeasonPlayers] = useState([]);
  const serverUrl = process.env.REACT_APP_SERVER_URL;

  const navigate = useNavigate();
  const userRole = sessionStorage.getItem('site');

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

  const editPlayer = (index) => {
    setActivePlayer(players[index]);
    setEditIndex(index);
  };

  const deletePlayer = (index) => {
    const updatedPlayers = players.filter((_, idx) => idx !== index);
    setPlayers(updatedPlayers);
    setActivePlayer({ name: '', jersey_number: '' });
    setEditIndex(-1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('Submitting:', year, players);

    try {
        // If no season exists, create new players and a new season
        const newPlayers = players.filter((p) => !p._id);
        const existingPlayers = players.filter((p) => p._id);

        // Create new players
        const playerPromises = newPlayers.map((player) => {
            return fetch(`${serverUrl}/api/players`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(player),
            }).then((response) => response.json());
        });

        const newlyCreatedPlayers = await Promise.all(playerPromises);

        const allPlayers = [...existingPlayers, ...newlyCreatedPlayers];

        // Check if the season already exists
        const endYear = year.split('-')[1];
        const seasonResponse = await fetch(`${serverUrl}/api/seasons/endYear/${endYear}/${sessionStorage.getItem('schoolID')}`);
        const existingSeason = await seasonResponse.json();

        if (existingSeason.message !== 'Season not found for the given year') {
            console.log('Season already exists:', existingSeason);
            console.log('Season ID: ' + existingSeason._id);

            // Update players for the existing season using the PATCH endpoint
            const updateResponse = await fetch(`${serverUrl}/api/seasons/${existingSeason._id}/players`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ players: allPlayers.map((p) => p._id) }),
            });

            if (!updateResponse.ok) {
                throw new Error(`Failed to update season players: ${updateResponse.statusText}`);
            }

            const updatedSeason = await updateResponse.json();
            console.log('Updated season:', updatedSeason);
        } else {
            // Create a new season
            const createSeasonResponse = await fetch(`${serverUrl}/api/seasons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ year, players: allPlayers.map((p) => p._id), schoolID: sessionStorage.getItem('schoolID') }),
            });

            if (!createSeasonResponse.ok) {
                throw new Error(`Failed to create season: ${createSeasonResponse.statusText}`);
            }

            const newSeason = await createSeasonResponse.json();
            console.log('Created new season:', newSeason);
        }

        // Reset form state
        setYear('');
        setPlayers([]);
        setActivePlayer({ name: '', jersey_number: '', position: ''});
        setEditIndex(-1);
    } catch (error) {
        console.error('Error handling submission:', error);
    }
  };

  return (
    <div className="create-season">
      <button className="btn-home top-right-button" onClick={() => navigate('/homepage')}>Home</button>
      {userRole !== 'Player' ? (
        <div className='create-season-container'>
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
          <div className="player-list-container">
            <View style={styles.container}>
              <Text style={styles.title}>Season Players:</Text>
            </View>
            {players.map((player, index) => (
              <div key={index} className="player-list-item">
                <div className="player-info">{player.name} - {player.jersey_number} - {player.position}</div>
                <div className="player-actions">
                  <button className="btnEdit" onClick={() => editPlayer(index)}>Edit</button>
                  <button className="btnDelete" onClick={() => deletePlayer(index)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="access-denied"><h2>Access Denied</h2><p>You do not have permission to create or edit a season.</p></div>
      )}
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ensures the container takes the full screen
    justifyContent: 'center', // Centers content vertically
    alignItems: 'center', // Centers content horizontally
  },
  title: {
    color: 'white', // Sets the text color to white
    fontSize: 20, // Adjust the font size
    fontWeight: 'bold', // Makes the text bold
    textAlign: 'center', // Centers the text within its container
    letterSpacing: 1.4, // Adds spacing between letters
  },
});

export default CreateSeason;
