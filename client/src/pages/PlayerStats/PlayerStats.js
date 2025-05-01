import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Selector from '../TeamStats/components/Selector';
import ImageMapper from "react-img-mapper";
import basketballCourtVector from './components/basketball-court-vector.jpg';
import './PlayerStats.css';

function PlayerStats() {
  // URL parameters for drill ID and player ID
  // These are used to fetch specific data when the component mounts
  const urlParams = new URLSearchParams(window.location.search);

  // State hooks for player and popup management
  const drillID = urlParams.get('DrillID');
  const navigate = useNavigate();


  const [allPlayers, setAllPlayers] = useState([]);
  const [avgOffensiveTempo, setAvgOffensiveTempo] = useState(0);
  const [avgDefensiveTempo, setAvgDefensiveTempo] = useState(0);
  const [statsData, setStatsData] = useState({}); //This is the data for the player's stats
  const [selectedDrill, setSelectedDrill] = useState(''); //This is a numerical ID, not an object
  const [allDrills, setAllDrills] = useState([]); // State for storing all drills data
  const [filteredDrills, setFilteredDrills] = useState([]); // State for storing filtered drills data
  const [selectedSession, setSelectedSession] = useState(''); // State for storing the selected session ID


  const [seasons, setSeasons] = useState([]); // State for storing seasons data
  const [selectedSeason, setSelectedSeason] = useState(''); // State for storing the selected season ID
  const [selectedPractice, setSelectedPractice] = useState(''); // State for storing the selected practice ID
  const [selectedGameOrPractice, setSelectedGameOrPractice] = useState('game'); // State for storing the selected game or practice
  const [games, setGames] = useState([]); // State for storing games data
  const [practices, setPractices] = useState([]); // State for storing practices data
  const [drills, setDrills] = useState([]); // State for storing drills data
  const [selectedGame, setSelectedGame] = useState(''); // State for storing the selected game ID
  const sessionIdParam  = urlParams.get('seasonId');
  const session = urlParams.get('session');
  const drillIdParam = urlParams.get('drillId');
  const playerID  = urlParams.get('playerID');
  const [selectedPlayer, setSelectedPlayer] = useState(() => {
    return allPlayers.length > 0 ? allPlayers[0] : null;
  });
  const serverUrl = process.env.REACT_APP_SERVER_URL;

  // This effect runs when the component mounts and fetches initial data
  // It fetches players, seasons, and either games or practices based on the selected type
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const seasonID = await getSeasonIDByDate();
  
        const [playerResponse, seasonsResponse] = await Promise.all([
          fetch(`${serverUrl}/api/players/bySeason/${seasonID}`),
          fetch(`${serverUrl}/api/seasons/school/${sessionStorage.getItem('schoolID')}`)
        ]);
  
        const playersData = await playerResponse.json();
        const seasonsData = await seasonsResponse.json();
  
        const formattedPlayers = playersData.map(player => ({
          label: `${player.name}`,
          position: `${player.position}`,
          value: player._id.toString(),
        }));
  
        const formattedSeasons = seasonsData.map(season => ({
          value: season._id,
          label: season.year,
        }));
  
        setAllPlayers(formattedPlayers);
        setSeasons(formattedSeasons);
  
        if (playerID) {
          const selected = formattedPlayers.find(p => p.value === playerID);
          setSelectedPlayer(selected);
        } else {
          setSelectedPlayer(formattedPlayers[0]);
        }
  
        setSelectedSeason(seasonsData[0]._id);
  
        if (selectedGameOrPractice === 'game') {
          await fetchGames(seasonsData[0]._id);
        } else {
          await fetchPractices(seasonsData[0]._id);
        }
  
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };
  
    fetchInitialData();
  }, []);

  // This effect runs when the selected game or practice changes
  // It fetches the drills for the selected practice and updates the stats and tempos accordingly
  useEffect(() => {
    const updatePlayerData = async () => {
      if (
        selectedPlayer &&
        (
          (selectedGameOrPractice === 'game' && selectedGame) ||
          (selectedGameOrPractice === 'practice' && selectedDrill) ||
          (selectedGameOrPractice === 'total')
        )
      ) {
        await fetchFullPlayerStats();
      }
  
      if (selectedGameOrPractice === 'game' && selectedGame) {
        fetchTempos(selectedGame);
      } else if (selectedGameOrPractice === 'practice' && selectedDrill) {
        fetchTempos(selectedDrill);
      } else if (selectedGameOrPractice === 'total') {
        setAvgOffensiveTempo(0);
        setAvgDefensiveTempo(0);
      }
    };
  
    updatePlayerData();
  }, [selectedPlayer, selectedGame, selectedDrill, selectedGameOrPractice]);

  // This effect runs when the selected drill changes
  // It fetches the stats and tempos for the selected drill
  useEffect(() => {
    if (selectedGameOrPractice === 'practice' && selectedDrill && selectedPlayer) {
      fetchFullPlayerStats();
      fetchTempos(selectedDrill);
    }
  }, [selectedDrill]);

  const getSeasonIDByDate = async () => {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    const year = currentDate.getFullYear();

    const computedYear = (month < 8 || (month === 8 && day < 2)) ? year - 1 : year + 1;

    const year1 = Math.min(year, computedYear).toString();
    const year2 = Math.max(year, computedYear).toString();

    // Get the current season for this school
    const seasonResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/seasons/endYear/${year2}/${sessionStorage.getItem('schoolID')}`);
    const seasonData = await seasonResponse.json();
    return seasonData._id;
  };

  /**
   * Fetches seasons data from the server.
   */
  const fetchSeasons = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/seasons/school/${sessionStorage.getItem('schoolID')}`);// Fetch seasons from the server
      const data = await response.json(); // Parse the response as JSON
      if (data.length > 0) {
        // Add each season to the seasons state
        data.forEach((season) => {
          setSeasons((prevSeasons) => [...prevSeasons, { value: season._id, label: season.year }]); // Add each season to the seasons state
        })

        setSelectedSeason(data[0]._id); // Select the first season by default
        fetchPractices(data[0]._id); // Fetch practices for the selected season
      }
    } catch (error) {
      console.error('Failed to fetch seasons:', error); // Log any errors to the console
    }
  };

    /**
   * Fetches games data for a given season ID.
   * @param {string} seasonId - The ID of the season. 
   */
    const fetchGames = async (seasonId) => {
      try {
        const response = await fetch(`${serverUrl}/api/games/bySeason/${seasonId}`);
        const gamesData = await response.json();
        if (gamesData.length > 0) {
          const formattedGames = gamesData.map((game) => ({
            value: game._id,
            label: `${game.opponent} - ${game.date.split("T")[0]}`
          }));
    
          setGames(formattedGames);
          setSelectedGame(formattedGames[0].value); // Set game only
        }
      } catch (error) {
        console.error('Failed to fetch games', error);
      }
    };

   /**
   * Fetches practices data for a given season ID.
   * @param {string} seasonId - The ID of the season.
   */
   const fetchPractices = async (seasonId) => {
    try {
      const response = await fetch(`${serverUrl}/api/practices/bySeason/${seasonId}`);
      const data = await response.json();
      if (data.length > 0) {
        const formattedPractices = data.map((practice) => ({
          value: practice._id,
          label: practice.date
        }));
  
        setPractices(formattedPractices);
        setSelectedPractice(formattedPractices[0].value); // Set practice only
      }
    } catch (error) {
      console.error('Failed to fetch practices', error);
    }
  };

  /**
   * Fetches drills data for a given practice ID.
   * @param {string} practiceId - The ID of the practice.
   */
  const fetchDrills = async (practiceId) => {
    try {
      const response = await fetch(`${serverUrl}/api/drills/practice/${practiceId}`);
      const data = await response.json();
  
      setStatsData({
        assists: 0,
        blocks: 0,
        steals: 0,
        turnovers: 0,
        offensive_rebounds: 0,
        defensive_rebounds: 0,
        fg_percentage: 0,
      });
      setAvgOffensiveTempo(0);
      setAvgDefensiveTempo(0);
  
      if (data.length > 0) {
        const formattedDrills = data.map(drill => ({
          value: drill._id,
          label: drill.name
        }));
        setDrills(formattedDrills);
  
        const firstDrillId = formattedDrills[0].value;
        setSelectedDrill(firstDrillId); //Only select drill here
      } else {
        setDrills([]);
        setSelectedDrill('');
      }
    } catch (error) {
      console.error('Failed to fetch drills:', error);
    }
  };

  const fetchFullPlayerStats = async () => {
    if (!selectedPlayer) return;
  
    // Reset stats to clear previous values
    setStatsData({
      assists: 0,
      blocks: 0,
      steals: 0,
      turnovers: 0,
      offensive_rebounds: 0,
      defensive_rebounds: 0,
      fg_percentage: 0,
      points: 0,
    });
  
    try {
      const statsResponse = await fetch(`${serverUrl}/api/stats/byPlayer/${selectedPlayer.value}`);
      const statsDataRaw = await statsResponse.json();
  
      const selection = selectedGameOrPractice === 'game' ? selectedGame : selectedDrill;
      let selectedStat = {
        assists: 0,
        blocks: 0,
        steals: 0,
        turnovers: 0,
        offensive_rebounds: 0,
        defensive_rebounds: 0,
        fg_percentage: 0,
        points: 0,
      };
  
      if (statsDataRaw.length > 0) {
        if (selectedGameOrPractice === 'total') {
          statsDataRaw.forEach(stat => {
            if (stat.onModel === "Game") {
              selectedStat.assists += stat.assists || 0;
              selectedStat.blocks += stat.blocks || 0;
              selectedStat.steals += stat.steals || 0;
              selectedStat.turnovers += stat.turnovers || 0;
              selectedStat.offensive_rebounds += stat.offensive_rebounds || 0;
              selectedStat.defensive_rebounds += stat.defensive_rebounds || 0;
            }
          });
        } else {
          const stat = statsDataRaw.find(stat => stat.gameOrDrill_id === selection);
          if (stat) {
            selectedStat = {
              assists: stat.assists || 0,
              blocks: stat.blocks || 0,
              steals: stat.steals || 0,
              turnovers: stat.turnovers || 0,
              offensive_rebounds: stat.offensive_rebounds || 0,
              defensive_rebounds: stat.defensive_rebounds || 0,
              fg_percentage: 0,
              points: 0,
            };
          }
        }
      }
  
      // Fetch shot data
      let shotsData = [];
  
      if (selectedGameOrPractice === 'game' && selectedGame) {
        const shotsResponse = await fetch(`${serverUrl}/api/shots/byGameOrDrill/${selectedGame}`);
        shotsData = await shotsResponse.json();
        shotsData = shotsData.filter(shot => shot.player_id === selectedPlayer.value && shot.onModel === "Game");
      } else if (selectedGameOrPractice === 'practice' && selectedDrill) {
        const shotsResponse = await fetch(`${serverUrl}/api/shots/byGameOrDrill/${selectedDrill}`);
        shotsData = await shotsResponse.json();
        shotsData = shotsData.filter(shot => shot.player_id === selectedPlayer.value && shot.onModel === "Drill");
      } else if (selectedGameOrPractice === 'total') {
        const shotsResponse = await fetch(`${serverUrl}/api/shots`);
        shotsData = await shotsResponse.json();
        shotsData = shotsData.filter(shot => shot.player_id === selectedPlayer.value && shot.onModel === "Game");
      }
  
      // FG% and Points calculation
      const totalShots = shotsData.length;
      const madeShots = shotsData.filter(shot => shot.made);

      console.log("Made shots for selected player:", madeShots);
      
      selectedStat.fg_percentage = totalShots > 0 ? ((madeShots.length / totalShots) * 100).toFixed(2) : 0;
  
      let points = 0;
      madeShots.forEach(shot => {
        const zone = parseInt(shot.zone);
        if ([1, 2, 3, 4, 5].includes(zone)) {
          points += 2;
        } else if ([6, 7, 8].includes(zone)) {
          points += 3;
        }
      });
      selectedStat.points = points;
  
      setStatsData(selectedStat);
    } catch (error) {
      console.error("Failed to fetch full player stats:", error);
    }
  };

  /**
   * Fetches tempos data for a given drill ID.
   * @param {string} drillId - The ID of the drill.
   */
  const fetchTempos = async (drillId) => {
    try {
      const response = await fetch(`${serverUrl}/api/tempos/byGameOrDrill/${drillId}`); // Fetch tempos for the given drill ID
      const tempoData = await response.json(); // Parse the response as JSON
      calculateAvgTempo(tempoData); // Calculate the average tempo from the fetched data
    } catch (error) {
      console.error('Failed to fetch tempos:', error); // Log any errors to the console
    }
  };

  /**
   * Calculates the average offensive and defensive tempo from the given tempo data.
   * @param {Array} tempoData - An array of tempo objects.
   */
    const calculateAvgTempo = (tempoData) => {
      const offensiveTempos = tempoData.filter((tempo) => tempo.tempo_type === 'offensive'); // Filter offensive tempos
      const defensiveTempos = tempoData.filter((tempo) => tempo.tempo_type === 'defensive'); // Filter defensive tempos
      const offensiveTempoAvg =
        offensiveTempos.length > 0
          ? offensiveTempos.reduce((total, tempo) => total + tempo.transition_time, 0) / offensiveTempos.length
          : 0; // Calculate average offensive tempo
      const defensiveTempoAvg =
        defensiveTempos.length > 0
          ? defensiveTempos.reduce((total, tempo) => total + tempo.transition_time, 0) / defensiveTempos.length
          : 0; // Calculate average defensive tempo
      setAvgOffensiveTempo(offensiveTempoAvg.toFixed(2)); // Update the offensive tempo state with the calculated average
      setAvgDefensiveTempo(defensiveTempoAvg.toFixed(2)); // Update the defensive tempo state with the calculated average
    };

  /**
   * Handles the change event for the game or practice selector.
   * @param {Event} e - The change event object.
   * 
   */
  const handleGameOrPracticeChange = async (e) => {
    const newSelectedGameOrPractice = e.target.value;
    setSelectedGameOrPractice(newSelectedGameOrPractice);
  
    if (newSelectedGameOrPractice === 'game') {
      setSelectedPractice('');
      setPractices([]);
      setSelectedDrill('');
      setDrills([]);
      await fetchGames(selectedSeason);
    } else if (newSelectedGameOrPractice === 'practice') {
      setSelectedGame('');
      setGames([]);
      const practicesResponse = await fetch(`${serverUrl}/api/practices/bySeason/${selectedSeason}`);
      const practicesData = await practicesResponse.json();
      if (practicesData.length > 0) {
        const formattedPractices = practicesData.map(practice => ({
          value: practice._id,
          label: practice.date,
        }));
        setPractices(formattedPractices);
        const firstPracticeId = formattedPractices[0].value;
        setSelectedPractice(firstPracticeId);
  
        // Now fetch drills for the first practice
        const drillsResponse = await fetch(`${serverUrl}/api/drills/practice/${firstPracticeId}`);
        const drillsData = await drillsResponse.json();
        if (drillsData.length > 0) {
          const formattedDrills = drillsData.map(drill => ({
            value: drill._id,
            label: drill.name,
          }));
          setDrills(formattedDrills);
          const firstDrillId = formattedDrills[0].value;
          setSelectedDrill(firstDrillId);
  
          // Immediately fetch stats and tempos for the first drill
          fetchTempos(firstDrillId);
          fetchFullPlayerStats();
        } else {
          // No drills found — clear stats
          setDrills([]);
          setSelectedDrill('');
          setStatsData({
            assists: 0,
            blocks: 0,
            steals: 0,
            turnovers: 0,
            offensive_rebounds: 0,
            defensive_rebounds: 0,
            fg_percentage: 0,
          });
          setAvgOffensiveTempo(0);
          setAvgDefensiveTempo(0);
        }
      }
    }
  };

  // This function handles the change of the selected session
  // It updates the selected session state and fetches the drills for the new session
  const handleSessionChange = (event) => {
    const newSessionId = event.target.value;
    setSelectedSession(newSessionId);
  
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('sessionId', newSessionId);
    window.history.pushState(null, '', `${window.location.pathname}?${urlParams}`);
  
    if (!Array.isArray(allDrills)) {
      console.error("Expected allDrills to be an array, but got:", allDrills);
      setFilteredDrills([]); // Fallback to an empty array
      return;
    }
  
    // Proceed with filtering
    const sessionDrills = allDrills.filter(drill => drill.practice_id === newSessionId);
    
    if (sessionDrills.length > 0) {
      const firstDrillId = sessionDrills[0]._id.toString();
      setSelectedDrill(firstDrillId);
      handleDrillChange({ target: { value: firstDrillId } });
  
      // Update the URL with the new drill ID
      urlParams.set('drillId', firstDrillId);
      window.history.pushState(null, '', `${window.location.pathname}?${urlParams}`);
    } else {
      // If no drills are found, clear the selected drill
      setSelectedDrill('');
    }
  };

  /*
    This function handles the change of the selected drill within a given session.

    Importantly, it sets the selected drill field to the new drill ID and updates the tempo and shot data to reflect the data from the new drill.
  */
    const handleDrillChange = (event) => {
      const newDrillId = event.target.value;
      setSelectedDrill(newDrillId);
  
      // Update the URL with the new drill ID
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('drillId', newDrillId);
      window.history.pushState(null, '', `${window.location.pathname}?${urlParams}`);
    };

  /**
   * Handles the change event for the season selector.
   * @param {Event} e - The change event object.
   */
  const handleSeasonChange = (e) => {
    const newSelectedSeason = e.target.value; // Get the newly selected season ID from the event
    setSelectedSeason(newSelectedSeason); // Update the selected season state
    fetchPractices(newSelectedSeason); // Fetch practices for the selected season
  };

  /**
   * Handles the change event for the practice selector.
   * @param {Event} e - The change event object.
   */
  const handlePracticeChange = (e) => {
    const newSelectedPractice = e.target.value; // Get the newly selected practice ID from the event
    setSelectedPractice(newSelectedPractice); // Update the selected practice state
    fetchDrills(newSelectedPractice); // Fetch drills for the selected practice
  };

  /**
   * Handles the change event for the game selector.
   * @param {Event} e - The change event object.
   */
  const handleGameChange = (e) => {
    const newSelectedGame = e.target.value; // Get the newly selected game ID from the event
    setSelectedGame(newSelectedGame); // Update the selected game state
    fetchTempos(newSelectedGame)
  }

  // This function handles the change of the selected player
  // It updates the selected player state and fetches the stats for the new player
  const handlePlayerChange = (event) => {
    const newPlayerID = event.target.value;
    const newSelectedPlayer = allPlayers.find(player => player.value === newPlayerID); 
  
    if (newSelectedPlayer) {
      setSelectedPlayer(newSelectedPlayer);
      setStatsData({}); // Reset stats while new stats are loading
    }
  
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('playerID', newPlayerID);
    window.history.pushState(null, '', `${window.location.pathname}?${urlParams}`);
  };

  let MAP2 = {
    name: "my-map",
    areas: [
    {name: "3", shape: "poly", coords: [25, 1.5, 26, 20, 29, 40, 105, 40, 105, 1.5].map((n, i) => i % 2 === 0 ? n * 1.3333 : n * 1.2245), fillColor: "rgba(23, 43, 79, .8)", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "green"},
    {name: "2", shape: "poly", coords: [193, 1.5, 193, 40, 270, 40, 273, 20, 275, 1.5].map((n, i) => i % 2 === 0 ? n * 1.3333 : n * 1.2245), fillColor: "rgba(23, 43, 79, .8)", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "green"},
    {name: "1", shape: "poly", coords: [108, 1.5, 108, 102, 190, 102, 190, 1.5].map((n, i) => i % 2 === 0 ? n * 1.3333 : n * 1.2245), fillColor: "rgba(23, 43, 79, .8)", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "purple"},
    {name: "5", shape: "poly", coords: [30, 45, 103, 45, 103, 107, 150, 107, 150, 141, 126, 138, 115, 135, 110, 134, 100, 131, 95, 129, 90, 127, 85, 125, 74, 117, 65, 110, 40, 78, 38, 70].map((n, i) => i % 2 === 0 ? n * 1.3333 : n * 1.2245), fillColor: "rgba(23, 43, 79, .8)", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "red"},
    {name: "4", shape: "poly", coords: [30, 45, 108, 45, 108, 107, 150, 107, 150, 141, 126, 138, 115, 135, 110, 134, 100, 131, 95, 129, 90, 127, 85, 125, 74, 117, 65, 110, 40, 78, 38, 70].map((n, i) => i % 2 === 0 ? (300 - n) * 1.3333 : n * 1.2245), fillColor: "rgba(23, 43, 79, .8)", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "red"},
    {name: "8", shape: "poly", coords: [80, 127, 0, 250, 300, 250, 220, 127, 205, 134, 180, 141, 150, 145, 122, 142, 98, 135].map((n, i) => i % 2 === 0 ? n * 1.3333 : n * 1.2245), fillColor: "rgba(23, 43, 79, .8)", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "blue"},
    {name: "7", shape: "poly", coords: [0, 1.5, 20, 1.5, 23, 34, 35, 75, 40, 85, 45, 92, 50, 99, 55, 105, 60, 110, 65, 116, 70, 120, 79, 127, 0, 250].map((n, i) => i % 2 === 0 ? n * 1.3333 : n * 1.2245), fillColor: "rgba(23, 43, 79, .8)", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "blue"},
    {name: "6", shape: "poly", coords: [300, 1.5, 278, 1.5, 275, 34, 265, 75, 260, 85, 255, 92, 250, 99, 245, 105, 240, 110, 235, 116, 230, 120, 221, 127, 300, 250].map((n, i) => i % 2 === 0 ? n * 1.3333 : n * 1.2245), fillColor: "rgba(23, 43, 79, .8)", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "blue"}
    ]
  };

  return (
    <div className="main-container">
      <button className='btn-home top-right-button' onClick={() => navigate('/homepage')}>Home</button>
      <div className="player-stats-container">
          <div className="ps-selectors">
            <Selector
                options={allPlayers}
                onChange={handlePlayerChange}
                label="Player"
                value={selectedPlayer ? selectedPlayer.value : ""}
              />
              <Selector
                options={[
                  { value: 'game', label: 'Game' },
                  { value: 'practice', label: 'Practice' },
                  { value: 'total', label: 'Total' }
                ]}
                value={selectedGameOrPractice}
                onChange={handleGameOrPracticeChange}
                label="Game/Practice/Total"
              />
            {selectedGameOrPractice === 'game' && (
              <Selector
                options={games}
                value={selectedGame}
                onChange={handleGameChange}
                label="Game"
              />
            )}
            {/* Only show the Drill selector if 'practice' is selected */}
            {selectedGameOrPractice === 'practice' && (
              <>
                <Selector
                  options={practices}
                  value={selectedPractice}
                  onChange={handlePracticeChange}
                  label="Practice"
                />
                {drills.length > 0 && (
                  <Selector
                    options={drills}
                    value={selectedDrill}
                    onChange={handleDrillChange}
                    label="Drill"
                  />
                )}
              </>
            )}
            <Selector
              options={seasons}
              value={selectedSeason}
              onChange={handleSeasonChange}
              label="Season"
            />
        </div>
        <div className='layout-container'>
          <div className="player-headshot">
          <img src={(() => {
            try{
              return require(`../../images/${(selectedPlayer?.label || "").toLowerCase().replace(/ /g, "_")}.png`);
            } 
            catch (error) {
              return require('../../images/default.png');
            }
            })()} alt={selectedPlayer ? selectedPlayer.label : "Default Player"} onError={(e) => e.target.src = require('../../images/default.png')} 
          />
          </div>
          <div className="bio-text">
              <p><strong>Name:</strong> {selectedPlayer ? selectedPlayer.label : "Select a player"}</p>
              <p><strong>Position:</strong> {selectedPlayer ? selectedPlayer.position : "N/A"}</p>
          </div>
          <div className="player-court-container">
              <ImageMapper
                src={basketballCourtVector}
                map={MAP2}
                width={400}
                height={300}
                lineWidth={5}
                strokeColor={"black"}
              />
          </div>
        </div>
        <div className="stats-container">
          <div className="unified-stats-card">
            <div className="stat-row">
              <h2>PlayerStats: </h2>
              <div className="stat-item">
                <span className="stat-label">FG%</span>
                <span className="stat-value">{statsData.fg_percentage || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Points</span>
                <span className="stat-value">{statsData.points || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Assists</span>
                <span className="stat-value">{statsData.assists || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Blocks</span>
                <span className="stat-value">{statsData.blocks || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Steals</span>
                <span className="stat-value">{statsData.steals || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Turnovers</span>
                <span className="stat-value">{statsData.turnovers || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">O-Rebounds</span>
                <span className="stat-value">{statsData.offensive_rebounds || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">D-Rebounds</span>
                <span className="stat-value">{statsData.defensive_rebounds || 0}</span>
              </div>
            </div>
          </div>
          <div className="unified-stats-card">
            <div className="stat-row">
              <div className="stat-item">
                <span className="tempo-label">Average Offensive Tempo </span>
                <span className="tempo-value">{avgOffensiveTempo} seconds</span>
              </div>
              <div className="stat-item">
                <span className="tempo-label">Average Defensive Tempo</span>
                <span className="tempo-value">{avgDefensiveTempo} seconds</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerStats;