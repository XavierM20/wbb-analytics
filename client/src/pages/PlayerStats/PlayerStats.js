import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2'; // For displaying bar charts
import { useNavigate } from 'react-router-dom';
import Selector from '../TeamStats/components/Selector';
import Heatmap from '../TeamStats/components/Heatmap';
import TempoCard from '../TeamStats/components/TempoCard';
import StatCard from '../TeamStats/components/StatsDisplay';
import ShotPopup from './components/ShotPopup';
import ImageMapper from "react-img-mapper";
import basketballCourtVector from './components/basketball-court-vector.jpg';
import ShotsByClock from './components/ShotsByClock';
import './PlayerStats.css';

function PlayerStats() {
  /* 
    
  */
  const urlParams = new URLSearchParams(window.location.search);

  // State hooks for timing and tempo tracking
  const [isTiming, setIsTiming] = useState(false);
  const [resetTimer, setResetTimer] = useState(false);
  const [currentTempo, setCurrentTempo] = useState(0);
  const [recordedTempo, setRecordedTempo] = useState(null);
  const [lastTempo, setLastTempo] = useState(0);
  const [tempoType, setTempoType] = useState(null);
  const [avgTempo, setAvgTempo] = useState(0);
  const [tempoCount, setTempoCount] = useState(1);
  const [totalTempo, setTotalTempo] = useState(0);

  // State hooks for player and popup management
  const [playersOnCourt, setPlayersOnCourt] = useState([]);
  const [isPlayerSelectedforShot, setIsPlayerSelectedforShot] = useState(false);
  const [player, setPlayer] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedPlayerForSub, setSelectedPlayerForSub] = useState(null);
  const [isShotPopupOpen, setIsShotPopupOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [isESOpen, setIsESOpen] = useState(false);
  const [statName, setStatName] = useState("");
  const drillID = urlParams.get('DrillID');
  const navigate = useNavigate();


  const [sessions, setSessions] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [allDrills, setAllDrills] = useState([]);
  const [filteredDrills, setFilteredDrills] = useState([]);
  const [allTempos, setAllTempos] = useState([]);
  const [filteredTempos, setFilteredTempos] = useState([]);
  const [allShots, setAllShots] = useState([]);
  const [filteredShots, setFilteredShots] = useState([]);
  const [avgOffensiveTempo, setAvgOffensiveTempo] = useState(0);
  const [avgDefensiveTempo, setAvgDefensiveTempo] = useState(0);
  const [shotClockData, setShotClockData] = useState([]); //
  const [shotPointData, setShotPointData] = useState([]); //[2][2] array where the first index is the number of made shots and the second index is the total number of shots attempted
  const [shotPoints, setShotPoints] = useState(0); //This is the total number of points scored in the drill
  const [allStats, setAllStats] = useState([]); //This is the data for the player's stats
  const [statsData, setStatsData] = useState([]); //This is the data for the player's stats
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedDrill, setSelectedDrill] = useState(''); //This is a numerical ID, not an object

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


useEffect(() => {
  const fetchInitialData = async () => {
    try {
      const seasonID = await getSeasonIDByDate();
      const playerResponse = await fetch(serverUrl + `/api/players/bySeason/${seasonID}`); 
      const playerData = await playerResponse.json();

      await fetchSeasons();
      await fetchGames(seasonID);
      await fetchTempos(drillID);
      
      const formattedPlayers = playerData.map(player => ({
        label: `${player.name}`,
        position: `${player.position}`,
        value: player._id.toString(),
      }));

      setAllPlayers(formattedPlayers);

      if (playerID) {
        const selected = playerData.find(player => player._id === playerID);
        setSelectedPlayer(selected);
        fetchPlayerData(selected._id);
      } else if (playerData.length > 0) {
        const firstPlayer = formattedPlayers[0];
        setSelectedPlayer(firstPlayer);
        fetchPlayerData(firstPlayer.value);
      }
    } catch (error) {
      console.error("Failed to fetch player data: ", error);
    }
    try{
      const sessionResponse = await fetch(serverUrl + '/api/practices');
      const sessionData = await sessionResponse.json();
      //console.log(sessionData)
      const formattedSessions = sessionData.map(session => {
        const date = new Date(session.date); // Create a date object
        // Format the date as MM/dd/yyyy
        const formattedDate = ((date.getMonth() + 1) + '').padStart(2, '0') + '/' + 
                              (date.getDate() + '').padStart(2, '0') + '/' + 
                              date.getFullYear();
        return {
          label: `Session: ${formattedDate}`,
          value: session._id.toString(),
        };
      });
      //console.log("These are sessions: ")
      //console.log(sessionData);
      setSessions(formattedSessions);
      if (sessionIdParam) {
        setSelectedSession(sessionIdParam);
      } else if (formattedSessions.length > 0) {
        setSelectedSession(formattedSessions[0].value);
      }
    } catch (error){
      console.error("Failed to fetch session data: ", error);
    }
  };
  fetchInitialData();
  //submitTempo();
}, []);

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

useEffect(() => {
  if (allPlayers.length > 0 && !selectedPlayer) {
    const firstPlayer = allPlayers[0];
    setSelectedPlayer(firstPlayer);
    fetchPlayerData(firstPlayer.value); // Ensure stats load for first player
  }
}, [allPlayers]);

useEffect(() => {
  if (!Array.isArray(allDrills)) {
    console.error("allDrills is not an array:", allDrills);
    setFilteredDrills([]); // Fallback to an empty array
    return;
  }

  setFilteredDrills(allDrills.filter(drill => drill.practice_id === selectedSession)
    .map(drill => ({
      label: `${drill.name}`,
      value: drill._id.toString(),
    })));

  if (selectedDrill) {
    // Filter tempos for the selected drill
    updateTempoData();
    // Filter shots for the selected drill
    updateShotData();
  }
}, [selectedSession, selectedDrill, allDrills, allTempos, allShots]);

  const pointSectionLabels = ["2 pt FG %", "3 pt FG %"]; //This is for the shot point data
  const sectionLabels = ["30-20", "20-10", "10-0"]; //This is for the shot clock data

  const handlePlayerChange = (event) => {
    const newPlayerID = event.target.value;
    const newSelectedPlayer = allPlayers.find(player => player.value === newPlayerID); 

    if (newSelectedPlayer) {
      setSelectedPlayer(newSelectedPlayer);
    }
  
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('playerID', newPlayerID);
    window.history.pushState(null, '', `${window.location.pathname}?${urlParams}`);

    // Immediately filter drills for the newly selected session and set the first drill as selected
    // This assumes allDrills has been previously populated with all available drills
    fetchPlayerData(newPlayerID);
  }

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

    //Immediately filter tempos for the newly selected drill
    updateTempoData();
    updateShotData();
    const drillStats = allStats.find(stats => stats.drill_id === newDrillId);
    setStatsData(drillStats);
    console.log(drillStats)
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
      console.log('fetching games');
      try {
        const response = await fetch(`${serverUrl}/api/games/bySeason/${seasonId}`)
        const games = await response.json();
        if (games.length > 0) {
          games.forEach((game) => {
            setGames((prevGames) => [...prevGames, {value: game._id, label: `${game.opponent} - ${game.date.split("T")[0]}`}])
          })
        }
        fetchShots(games[0]._id)
      } catch (error) {
        console.error('Failed to fetch games ', error)
      }
    }

   /**
   * Fetches practices data for a given season ID.
   * @param {string} seasonId - The ID of the season.
   */
   const fetchPractices = async (seasonId) => {
    try {
      const response = await fetch(`${serverUrl}/api/practices/bySeason/${seasonId}`);
      const data = await response.json(); // Parse the response as JSON
      //setPractices(data); // Update the practices state with the fetched data
      if (data.length > 0) {
        // Add each practice to the practices state
        data.forEach((practice) => {
          setPractices((prevPractices) => [...prevPractices, { value: practice._id, label: practice.date }]); // Add each practice to the practices state
        })

        setSelectedPractice(data[0]._id); // Select the first practice by default
        console.log(data[0]._id);
        fetchDrills(data[0]._id); // Fetch drills for the selected practice
      }
    } catch (error) {
      console.error('Failed to fetch practices:', error); // Log any errors to the console
    }
  };

  /**
   * Fetches drills data for a given practice ID.
   * @param {string} practiceId - The ID of the practice.
   */
    const fetchDrills = async (practiceId) => {
      try {
        console.log(practiceId);
        const response = await fetch(`${serverUrl}/api/drills/practice/${practiceId}`); // Fetch drills for the given practice ID
        const data = await response.json(); // Parse the response as JSON
        //setDrills(data); // Update the drills state with the fetched data
        if (data.length > 0) {
          data.forEach((drill) => {
            setDrills((prevDrill) => [...prevDrill, { value: drill._id, label: drill.name }]); // Add each practice to the practices state
          })
          setSelectedDrill(data[0]._id); // Select the first drill by default
          fetchTempos(data[0]._id); // Fetch tempos for the selected drill
          fetchShots(data[0]._id); // Fetch shots for the selected drill
        }
      } catch (error) {
        console.error('Failed to fetch drills:', error); // Log any errors to the console
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
   * Fetches shots data for a given drill ID.
   * @param {string} drillId - The ID of the drill.
   */
  const fetchShots = async (drillId) => {
    try {
      const response = await fetch(`${serverUrl}/api/shots/byGameOrDrill/${drillId}`);// Fetch all shots
      const allShots = await response.json(); // Parse the response as JSON
      const filteredShots = allShots.filter((shot) => shot.gameOrDrill_id === drillId); // Filter shots by the selected drill ID
      //processShotsForChart(filteredShots); // Process the filtered shots for the chart
    } catch (error) {
      console.error('Failed to fetch shots:', error); // Log any errors to the console
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
  const handleGameOrPracticeChange = (e) => {
    const newSelectedGameOrPractice = e.target.value; // Get the newly selected game or practice from the event
    setSelectedGameOrPractice(newSelectedGameOrPractice); // Update the selected game or practice state
    if (newSelectedGameOrPractice == 'game') {
      setSelectedPractice('');
      setPractices([]);
      setSelectedDrill('');
      setDrills([]);
      fetchGames(selectedSeason); // Fetch games for the selected season
    } else {
      setSelectedGame('');
      setGames([]);
      fetchPractices(selectedSeason); // Fetch practices for the selected season
    }
  }

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

  

  const handleGameChange = (e) => {
    const newSelectedGame = e.target.value; // Get the newly selected game ID from the event
    setSelectedGame(newSelectedGame); // Update the selected game state
    fetchTempos(newSelectedGame)
    fetchShots(newSelectedGame)
  }

  /*
    This function updates the average offensive and defensive tempos for the selected drill

    It filters the tempos for the selected drill (taken from above) and sets the average offensive and defensive tempos to 0 before doing its calculations so that no data is contaminated (hopefully)
  */
  const updateTempoData = () => {
    // Filter tempos for the selected drill
    const temposForDrill = allTempos.filter(tempo => tempo.gameOrDrill_id === selectedDrill);
    setAvgOffensiveTempo(0);
    setAvgDefensiveTempo(0);
    setFilteredTempos(temposForDrill);
    var numOffensive = 0;
    var numDefensive = 0;
    var sumOffensiveTempo = 0;
    var sumDefensiveTempo = 0;
    for (var i = 0; i < temposForDrill.length; i++){
        if(temposForDrill[i].tempo_type === "offensive" && !isNaN(temposForDrill[i].transition_time)){
            sumOffensiveTempo += temposForDrill[i].transition_time;
            numOffensive++;
        }
        else if(temposForDrill[i].tempo_type === "defensive" && !isNaN(temposForDrill[i].transition_time)){
            sumDefensiveTempo += temposForDrill[i].transition_time;
            numDefensive++;
        }
        else{
            console.log("Error: Tempo type not recognized or transition time is not a number " + temposForDrill[i].tempo_type)
        }
    }
    setAvgOffensiveTempo(numOffensive > 0 ? (sumOffensiveTempo / numOffensive).toFixed(2) : 0); //Checks if there are any tempos to average
    setAvgDefensiveTempo(numDefensive > 0 ? (sumDefensiveTempo / numDefensive).toFixed(2) : 0);
  };

  /*
    This function updates the shot data for the selected drill.

    It filters the shot data for a given player by the selected drill and then updates the shot clock data for the player.
  */
  const updateShotData = () => {
    //var time = performance.now()
    const shotsForDrill = allShots.filter(shot => shot.gameOrDrill_id === selectedDrill);
    setFilteredShots(shotsForDrill);
    //console.log(selectedDrill)
    //console.log(shotsForDrill)
    //FG = total # shots made over total # shots attempted
    // 6 7 and 8 are 3-point
    var shotClockDat = [[0, 0], [0, 0], [0, 0]]; //This is a two-dimensional array that has the third in the first index, and the number of made shots and number of total shots in the second index. So, shotDat[0][0] is the shots *made* in the first third, and shotDat[0][1] is the shots attempted.
    var shotPointDat = [[0,0],[0,0]]; //This is a two-dimensional array that has the number of made # point shots in the first column and the total number of # point shots attempted in the second. The first row is 2-point shots and the second row is 3-point shots
    var shotCountsByZone = {};
    var shotPoints = 0;

    for(var i = 1; i < 9; i++)
      shotCountsByZone[i] = {made: 0, total: 0}; //This is gross and allows the bar graph to display all zones, even when no shots are made in a zone.  

    for(var i = 0; i < shotsForDrill.length; i++){
      if(shotsForDrill[i].zone < 6){
        shotPointDat[0][1]++;
        if(shotsForDrill[i].made){
          shotPointDat[0][0]++;
          shotPoints += 2;
        }
      }
      else if(shotsForDrill[i].zone >= 6 && shotsForDrill[i].zone < 9){
        shotPointDat[1][1]++;
        if(shotsForDrill[i].made){
          shotPointDat[1][0]++;
          shotPoints += 3;
        }
      }
      if (!shotCountsByZone[shotsForDrill[i].zone]) {
        shotCountsByZone[shotsForDrill[i].zone] = { made: 0, total: 0 };
      }
      shotCountsByZone[shotsForDrill[i].zone].total += 1;
      if (shotsForDrill[i].made) {
        shotCountsByZone[shotsForDrill[i].zone].made += 1;
      }
      switch(shotsForDrill[i].shot_clock_time){ //The options are "first_third", "second_third", and "final_third" for some reason
        case "first_third":
          shotClockDat[0][1]++;
          if(shotsForDrill[i].made)
            shotClockDat[0][0]++;
          break;
        case "second_third":
          shotClockDat[1][1]++;
          if(shotsForDrill[i].made)
            shotClockDat[1][0]++;
          break;
        case "final_third":
          shotClockDat[2][1]++;
          if(shotsForDrill[i].made)
            shotClockDat[2][0]++;
          break;
        default:
          console.log("Error: Shot clock time not recognized " + shotsForDrill[i].shot_clock_time);
      }
    }
    setShotClockData(shotClockDat);
    setShotPointData(shotPointDat);
    setShotPoints(shotPoints);

    console.log(shotCountsByZone)

    const labels = [];
    const data = [];

    Object.keys(shotCountsByZone).sort().forEach(zone => {
      labels.push(`Zone ${zone}`);
      const { made, total } = shotCountsByZone[zone];
      const percentage = total > 0 ? (made / total) * 100 : 0;
      data.push(percentage.toFixed(2)); // Keep only two decimal places
    });

    //var end = performance.now()
    //console.log("Time to update shot data: " + (end - time))
  };

  const fetchPlayerData = async (playerID) => {
    try {
      const drillResponse = await fetch(serverUrl + '/api/drills/players/'+ playerID);
      const drillData = await drillResponse.json();
      //console.log("These are the drills Maddie is in: ")
      //console.log(drillData);
      if(drillData.length)
        setAllDrills(drillData);
      else{
        var temp = {  }
        setAllDrills(temp)
      }
      if (drillIdParam) {
        setSelectedDrill(drillIdParam);
      } else if (drillData.length > 0) {
        setSelectedDrill(drillData[0]._id.toString());
      }
    } catch (error) {
      console.error("Failed to fetch drill data:", error);
    }
    try {
      const tempoResponse = await fetch(serverUrl + '/api/tempos/byPlayer/' + playerID);
      const tempoData = await tempoResponse.json();
      //console.log("These are tempos:")
      //console.log(tempoData);
      setAllTempos(tempoData);
    } catch (error){
      console.error("Failed to fetch tempos from drill data:", error);
    }
    try {
      const shotsResponse = await fetch(serverUrl + '/api/shots/');//byPlayer/' + playerID);
      const shotsData = await shotsResponse.json(); //This is not programmed to get shots by player yet; the route does not cooperate
      const filteredShotsData = shotsData.filter(shot => shot.player_ids === playerID);
      //console.log("These are shots:")
      //console.log(filteredShotsData);
      setAllShots(filteredShotsData);
    } catch (error) {
      console.error("Failed to fetch shot data:", error);
    }
    try {
      const statsResponse = await fetch(serverUrl + '/api/stats/byPlayer/' + playerID);
      const statsData = await statsResponse.json();
      //console.log("These are stats:")
      //console.log(statsData);
      setAllStats(statsData);
      //console.log(statsData)
    } catch (error) {
      console.error("Failed to fetch stats data:", error);
    }
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

const handleCourtOverlayClick = () => {
  //setIsShotPopupOpen(false);
  setIsPlayerSelectedforShot(false);
  setIsShotPopupOpen(false);
};

const courtClicked = (area) => {
  console.log(area);
  handleCourtClick(area.name);
}

const handleCourtClick = (area) => {
  console.log(`Player ${area} clicked for shot`);
  setSelectedZone(area);
  setIsShotPopupOpen(true);
}

    // Example method signatures in the TempoPage component
    const onPlayerSelectForShot = (player) => {
      setIsPlayerSelectedforShot(true);
      setPlayer(player);
  };

  const onPlayerSelectForSub = (player) => {
      setSelectedPlayerForSub(player); // Set the player selected for substitution
      setIsPopupOpen(true); // Open the substitution popup
  };

  const handleESClose = () => {
      setIsESOpen(false);
  }

  const handleShotPopupClose = () => {
    setIsShotPopupOpen(false);
    setIsPlayerSelectedforShot(false);
}

  const recordStats = async (player, route) => {
      if (isPlayerSelectedforShot) {

          setIsESOpen(true);

          // Fetch the player's stats from the server
          const statResponse = await fetch(`${serverUrl}/api/stats/byPlayer/${player.id}`);
          if (!statResponse.ok) {
              console.error(`Failed to fetch player stats: HTTP Error: ${statResponse.status}`);
              return;
          }
          const playerStatsArray = await statResponse.json();

          if (!playerStatsArray.length) {
              console.error('No stats found for player:', player.id);
              return; // Exit if no stats found
          }

          // Assuming the first object is the one we want to update
          const filteredPlayerStatsArray = playerStatsArray.filter(array => array.drill_id === drillID);

          const playerStats = filteredPlayerStatsArray[0];

          // Submit the updated stats to the server
          try {
              const response = await fetch(`${serverUrl}/api/stats/${route}/${playerStats._id}`, {
                  method: 'PATCH',
                  headers: {
                      'Content-Type': 'application/json'
                  }
              });
              if (!response.ok) {
                  throw new Error(`HTTP Error: ${response.status}`);
              }
              const updatedStats = await response.json();
              console.log('Stats updated:', updatedStats);
          } catch (error) {
              console.error('Error updating stats:', error);
          }
      }
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
                  { value: 'practice', label: 'Practice' }
                ]}
                value={selectedGameOrPractice}
                onChange={handleGameOrPracticeChange}
                label="Game or Practice?"
              />
              {selectedGameOrPractice === 'game' ? (
              <Selector
                options={games}
                value={selectedGame}
                onChange={handleGameChange}
                label="Game"
              />
            ) : (
              <Selector
                options={practices}
                value={selectedPractice}
                onChange={handlePracticeChange}
                label="Practice"
              />
            )}
            {/* Only show the Drill selector if 'practice' is selected */}
            {selectedGameOrPractice === 'practice' && (
              <Selector
                options={drills}
                value={selectedDrill}
                onChange={handleDrillChange}
                label="Drill"
              />
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
                onClick={courtClicked}
              />
              {isShotPopupOpen && isPlayerSelectedforShot && (
                <>
                  <div className="Overlay" onClick={handleCourtOverlayClick}></div>
                    <ShotPopup
                      isOpen={isShotPopupOpen}
                      onClose={() => handleShotPopupClose()}
                      gameOrDrill_id={drillID}
                      onModel="Drill"
                      player_id={player.id}
                      zone={selectedZone}
                    />
                </>
              )}
          </div>
        </div>
  {/*      <div className="detailed-stats">
    
          <div className="tempo-cards">
            <TempoCard title="Avg Offensive Tempo" tempo={avgOffensiveTempo} />
            <TempoCard title="Avg Defensive Tempo" tempo={avgDefensiveTempo} />
          </div>
          
          <div className="charts-container">
            <div classname='bar-container'>
              <Bar
                  data={barChartData}
                  options={chartOptions}
              />
            </div>
            <div className="shots-table-container">
              {shotClockData.map((section, index) => (
                <ShotsByClock key={index} section={sectionLabels[index]} made={section[0]} total={section[1]} />
              ))}
            </div>
          </div>
        </div>
    */}
  {/*
        <div className="stats-overview">
          <StatCard title="Total Points" value={shotPoints} />
          {shotPointData.map((section, index) => (
            <StatCard key={index} title={pointSectionLabels[index]} value={(section[0]/section[1] * 100).toFixed(2)} />
          ))}
        </div>
        <div className="stat-cards">
          <StatCard title="Total Rebounds" value={statsData.total_rebounds || 0} />
          <StatCard title="Assists" value={statsData.assists || 0} />
          <StatCard title="Steals" value={statsData.steals || 0} />
          <StatCard title="Blocks" value={statsData.blocks || 0} />
          <StatCard title="Turnovers" value={statsData.turnovers || 0} />
          <StatCard title="Personal Fouls" value={statsData.personal_fouls || 0} />
        </div>
  */}
        <div className="stats-container">
          <div className="unified-stats-card">
            <div className="stat-row">
              <h2>PlayerStats: </h2>
              <div className="stat-item">
                <span className="stat-label">MPG</span>
                <span className="stat-value">{statsData.mpg || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">FG%</span>
                <span className="stat-value">{statsData.fg_percentage || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">3P%</span>
                <span className="stat-value">{statsData.three_pt_percentage || 0}</span>
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
                <span className="stat-label">Personal Fouls</span>
                <span className="stat-value">{statsData.personal_fouls || 0}</span>
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