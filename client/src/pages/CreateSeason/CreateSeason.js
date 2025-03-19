import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import './CreateSeason.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/AuthProvider'; // Assuming you have an AuthProvider

function CreateSeason() {
  const [year, setYear] = useState('');
  const [players, setPlayers] = useState([]);
  const [activePlayer, setActivePlayer] = useState({ name: '', jersey_number: '', position: ''   });
  const [editIndex, setEditIndex] = useState(-1);
  const [jerseyError, setJerseyError] = useState('');
  const [previousSeasonPlayers, setPreviousSeasonPlayers] = useState([]);
  const serverUrl = process.env.REACT_APP_SERVER_URL;

  const navigate = useNavigate();
  const { user } = useAuth(); // Fetch the authenticated user
  const userRole = user?.role || 'Player'; // Default to "Player" if role isn't found


  /*
    When a season year is typed, parse for the end year then check if that season already exists.
    If it does, fetch the players for that season and display them.
  */

  useEffect(() => {
    if (year.length === 9) {
      // Parse the inputted season for start and end year
      const startYear = year.split('-')[0];
      const endYear = year.split('-')[1];

      // Fetch for the end year, if exists fetch players
      fetch(`${serverUrl}/api/seasons/endYear/${endYear}/${sessionStorage.getItem('schoolID')}`)
        .then(response => response.json())
        .then(data => {
          // Call fetch players
          fetchPlayers(data.players)
        })
        .catch(error => {
          console.error('Error fetching the previous season:', error);
          setPreviousSeasonPlayers([]);
        });
    } else {
      setPlayers([]);
    }
  }, [year, serverUrl]);

  /*
    Function: fetchPlayers
    Description: Fetches the players for the season from the server then adds them to the players state.
    Parameters: playerIds - Array of player IDs to fetch from the server.
  */
    const fetchPlayers = (playerIds) => {
      Promise.all(playerIds.map(id =>
        fetch(`${serverUrl}/api/players/${id}`)
          .then(response => response.json())
      )).then(players => {
        setPlayers(players);
      });
    };
  

    const handleYearChange = (event) => {
      let input = event.target.value;
      const yearFormatRegex = /^(\d{0,4})-?(\d{0,4})$/;
      const match = input.match(yearFormatRegex);
  
      if (match) {
        let startYear = match[1];
        let endYear = match[2];
  
        if (startYear.length === 4 && year.length === 3) {
          startYear += '-';
        }
  
        if (startYear.length === 4 && endYear.length > 0) {
          const nextYear = parseInt(startYear) + 1;
          endYear = nextYear.toString().slice(0, 4);
        }
  
        input = startYear + (endYear.length > 0 ? '-' + endYear : '');
        setYear(input);
      } else {
        setYear('');
      }
    };

  const handlePlayerChange = (field, value) => {
    setActivePlayer(prev => ({ ...prev, [field]: value }));
    setJerseyError('');
  };

  const addOrUpdatePlayer = () => {
    if (activePlayer.name.trim() === '') {
        setJerseyError('Player name cannot be empty.');
        return;
    }

    if (activePlayer.jersey_number.trim() === '') {
        setJerseyError('Jersey number cannot be empty.');
        return;
    }

   

    const jerseyNumberInt = parseInt(activePlayer.jersey_number, 10);
    if (isNaN(jerseyNumberInt) || jerseyNumberInt < 0) {
        setJerseyError('Jersey number must be a valid number.');
        return;
    }

    // Ensure position is set to PG if empty
    const playerPosition = activePlayer.position || 'PG'

    // Check if jersey number is already in use by another player (not including the currently edited player if any)
    const isJerseyNumberInUse = players.some((p, idx) => p.jersey_number === jerseyNumberInt && idx !== editIndex);
    if (isJerseyNumberInUse) {
        setJerseyError('Jersey number already in use. Please choose another.');
        return;
    }

    let updatedPlayers = [...players];
    if (editIndex >= 0) {
        updatedPlayers[editIndex] = { ...activePlayer, jersey_number: jerseyNumberInt };
        setEditIndex(-1);
    } else {
        updatedPlayers.push({ ...activePlayer, jersey_number: jerseyNumberInt });
    }
    setPlayers(updatedPlayers);
    console.log('updatedPlayers:', updatedPlayers);
    setActivePlayer({ name: '', jersey_number: '', position: 'PG'}); // Clear the input fields
    setJerseyError(''); // Clear any error messages
};


  const selectPreviousPlayer = (player) => {
    setActivePlayer({ name: player.name, jersey_number: player.jersey_number.toString(), _id: player._id});
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

  /*
    Function: handleSubmit
    Parameters: event - Form submission event.
    Description: Handles the form submission for creating a new season.
    If a season already exists for the year, update the players for that season.
    If a season does not exist, create the season with all the players in the players state.
  */

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('Submitting:', year, players);

    try {
        const newPlayers = players.filter((p) => !p._id);
        const existingPlayers = players.filter((p) => p._id);

    try {
        // If no season exists, create new players and a new season
        const newPlayers = players.filter((p) => !p._id);
        const existingPlayers = players.filter((p) => p._id);

        // Create new players
         const playerPromises = newPlayers.map((player) =>
            fetch(`${serverUrl}/api/players`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(player),
            }).then((response) => response.json())
        );

        const newlyCreatedPlayers = await Promise.all(playerPromises);
        const allPlayers = [...existingPlayers, ...newlyCreatedPlayers];

        // Check if the season already exists
          const endYear = year.split('-')[1];
        const seasonResponse = await fetch(`${serverUrl}/api/seasons/endYear/${endYear}/${sessionStorage.getItem('schoolID')}`);
        const existingSeason = await seasonResponse.json();

        if (existingSeason.message !== 'Season not found for the given year') {
            console.log('Season already exists:', existingSeason);

            // Update players for the existing season using the PATCH endpoint
            const updateResponse = await fetch(`${serverUrl}/api/seasons/${existingSeason._id}/players`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ players: allPlayers.map((p) => p._id) }),
            });

            if (!updateResponse.ok) throw new Error(`Failed to update season players: ${updateResponse.statusText}`);

            console.log('Updated season:', await updateResponse.json());
        } else {
            // Create a new season
            const createSeasonResponse = await fetch(`${serverUrl}/api/seasons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year, players: allPlayers.map((p) => p._id), schoolID: sessionStorage.getItem('schoolID') }),
            });

            if (!createSeasonResponse.ok) throw new Error(`Failed to create season: ${createSeasonResponse.statusText}`);

            console.log('Created new season:', await createSeasonResponse.json());
        }
    
            // Reset form state
            setYear('');
            setPlayers([]);
            setActivePlayer({ name: '', jersey_number: '', position: '' });
            setEditIndex(-1);

          } catch (error) {
              console.error('Error handling submission:', error);
          }
      };

    return (
        <div className="create-season">
          <button className="btn-home top-right-button" onClick={() => navigate('/homepage')}>
            Home
          </button>
      
          {userRole !== 'Player' ? (
            <div className="form-container-season">
              <form onSubmit={handleSubmit}>
                <div>
                  <label>Season Year:</label>
                  <input 
                    type="text" 
                    id="yearInput" 
                    value={year} 
                    onChange={handleYearChange} 
                    placeholder="2023-2024" 
                    aria-label="input for season year"
                  />
                  <small>Enter the season start and end years (e.g., "2023-2024"). Years must be consecutive.</small>
                </div>
      
                <div className="player-input">
                  <label>Player Name:</label>
                  <input 
                    type="text" 
                    aria-label="input for player name" 
                    list="previous-players" 
                    value={activePlayer.name} 
                    onChange={(e) => handlePlayerChange('name', e.target.value)}
                    onBlur={(e) => {
                      const player = previousSeasonPlayers.find(p => p.name === e.target.value);
                      if (player) {
                        selectPreviousPlayer(player);
                      }
                    }}
                  />
                  <datalist id="previous-players">
                    {previousSeasonPlayers.map((player, index) => (
                      <option key={index} value={player.name} />
                    ))}
                  </datalist>
      
                  <label>Jersey Number:</label>
                  <input 
                    type="number" 
                    aria-label="input for jersey number" 
                    value={activePlayer.jersey_number} 
                    onChange={(e) => handlePlayerChange('jersey_number', e.target.value)}
                  />
                  {jerseyError && <div className="jersey-error">{jerseyError}</div>}
                   
                  <label>Position:</label>
                  <select aria-label="select for position" value={activePlayer.position} onChange={(e) => handlePlayerChange('position', e.target.value)}>
                    <option value="PG">PG</option>
                    <option value="SG">SG</option>
                    <option value="SF">SF</option>
                    <option value="PF">PF</option>
                    <option value="C">C</option>
                  </select>
      
                  <button type="button" onClick={addOrUpdatePlayer}>
                    {editIndex >= 0 ? 'Update Player' : 'Add Player'}
                  </button>
                </div>
      
                <button type="submit">Create/Edit Season</button>
              </form>
            </div>
          ) : (
            <div className="access-denied">
              <h2>Access Denied</h2>
              <p>You do not have permission to create or edit a season.</p>

            </div>
          )}
      
          <div className="player-list-container">
            <h3>Season Players:</h3>
            {players.map((player, index) => (
              <div key={index} className="player-list-item">
                <div className="player-info">
                  {player.name} - {player.jersey_number}
                </div>
                <div className="player-actions">
                  <button className="btnEdit" onClick={() => editPlayer(index)}>Edit</button>
                  <button className="btnDelete" onClick={() => deletePlayer(index)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
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
