import React, { useState, useEffect } from 'react';
import './CreateSeason.css';
import { ObjectId } from 'bson';
import { useNavigate } from 'react-router-dom';

function CreateSeason() {
  const [year, setYear] = useState('');
  const [players, setPlayers] = useState([]);
  const [activePlayer, setActivePlayer] = useState({ name: '', jersey_number: '' });
  const [editIndex, setEditIndex] = useState(-1);
  const [jerseyError, setJerseyError] = useState('');
  const [previousSeasonPlayers, setPreviousSeasonPlayers] = useState([]);
  const serverUrl = process.env.REACT_APP_SERVER_URL;

  const navigate = useNavigate();

  useEffect(() => {
    if (year.length === 9) {
      const startYear = year.split('-')[0];
      fetch(`${serverUrl}/api/seasons/endYear/${startYear}`)
        .then(response => response.json())
        .then(data => {
          fetchPlayers(data.players);
        })
        .catch(error => {
          console.error('Error fetching the previous season:', error);
          setPreviousSeasonPlayers([]);
        });
    }
  }, [year, serverUrl]);

  const fetchPlayers = (playerIds) => {
    Promise.all(playerIds.map(id =>
      fetch(`${serverUrl}/api/players/${id}`)
        .then(response => response.json())
    )).then(players => {
      setPreviousSeasonPlayers(players);
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
    if (isNaN(jerseyNumberInt)) {
        setJerseyError('Jersey number must be a valid number.');
        return;
    }

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
    setActivePlayer({ name: '', jersey_number: '' }); // Clear the input fields
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

  const handleSubmit = (event) => {
    const seasonId = '';
    event.preventDefault();
    console.log('Submitting:', year, players);
    // check for player in players that doesn't have an _id
    // if found, create the player
    // then create the season with the player ids
    const newPlayers = players.filter(p => !p._id);
    const existingPlayers = players.filter(p => p._id);
    const playerPromises = newPlayers.map(player => {
        return fetch(`${serverUrl}/api/players`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(player)
        })
            .then(response => response.json());
    });
    // update players so newPlayers have _id
    Promise.all(playerPromises)
        .then(newPlayers => {
            const updatedPlayers = [...existingPlayers, ...newPlayers];
            console.log('All players created:', updatedPlayers);
            return fetch(`${serverUrl}/api/seasons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ year, players: updatedPlayers.map(p => p._id) })
            });
        })
        .then(response => response.json())
        .then(data => {
            console.log('Season created:', data);
            console.log('season id:', data._id);
            // Update players with the new season ID
            const seasonId = data._id;
            const playerUpdatePromises = players.map(player => {
                return fetch(`${serverUrl}/api/players/${player._id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ seasons: [...player.seasons, ObjectId(seasonId)] })
                })
                    .then(response => response.json());
            });
            return Promise.all(playerUpdatePromises);
        })
        .then(() => {
            // Reset form state
            setYear('');
            setPlayers([]);
            setActivePlayer({ name: '', jersey_number: '' });
            setEditIndex(-1);
        })
        .catch(error => {
            console.error('Error creating season:', error);
        });
};


  return (
    <div className="create-season">
    <button className='btn-home top-right-button' onClick={() => navigate('/homepage')}>Home</button>
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="yearInput">Season Year:</label>
            <input
              type="text"
              id="yearInput"
              value={year}
              onChange={handleYearChange}
              placeholder="2023-2024"
            />
            <small>Enter the season start and end years (e.g., "2023-2024"). Years must be consecutive.</small>
          </div>
          <div className="player-input">
            <label>Player Name:</label>
            <input
              type="text"
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
              value={activePlayer.jersey_number}
              onChange={(e) => handlePlayerChange('jersey_number', e.target.value)}
            />
            {jerseyError && <div className="jersey-error">{jerseyError}</div>}
            <button type="button" onClick={addOrUpdatePlayer}>
              {editIndex >= 0 ? 'Update Player' : 'Add Player'}
            </button>
          </div>
          <button type="submit">Create Season</button>
        </form>
      </div>
      <div className="player-list-container">
        {players.map((player, index) => (
          <div key={index} className="player-list-item">
            {player.name} - {player.jersey_number}
            <button onClick={() => editPlayer(index)}>Edit</button>
            <button onClick={() => deletePlayer(index)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CreateSeason;
