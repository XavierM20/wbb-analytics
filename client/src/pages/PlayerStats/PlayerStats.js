import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2'; // For displaying bar charts
import Selector from '../TeamStats/components/Selector';
import Heatmap from '../TeamStats/components/Heatmap';
import TempoCard from '../TeamStats/components/TempoCard';
import StatCard from '../TeamStats/components/StatsDisplay';
import { useNavigate } from 'react-router-dom';

import ShotsByClock from './components/ShotsByClock';
import './PlayerStats.css';

const chartOptions = {
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        color: '#ffffff', // White y-axis labels
      }
    },
    x: {
      ticks: {
        color: '#ffffff', // White x-axis labels
      }
    }
  },
  plugins: {
    legend: {
      labels: {
        color: '#ffffff', // White legend text
      }
    },
    tooltip: {
      enabled: false, // Disable tooltips
    }
  },
  hover: {
    mode: null // Disable hover effects
  },
};


function PlayerStats() {
  /* 
    
  */
  const urlParams = new URLSearchParams(window.location.search);


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

  const [barChartData, setBarChartData] = useState({
    labels: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6', 'Zone 7', 'Zone 8'],
    datasets: [
      {
        label: '% of Shots Made',
        backgroundColor: 'rgba(255, 215, 0, 0.6)',
        borderColor: 'rgba(0,0,0,1)',
        borderWidth: 1,
      },
    ],
  });

  const sessionIdParam  = urlParams.get('seasonId');
  const session = urlParams.get('session');
  const drillIdParam = urlParams.get('drillId');
  const playerID  = urlParams.get('playerID');
  const [selectedPlayer, setSelectedPlayer] = useState(''); //
  const serverUrl = process.env.REACT_APP_SERVER_URL;

  const navigate = useNavigate();

useEffect(() => {
  const fetchInitialData = async () => {
    try {
      const playerResponse = await fetch(serverUrl + '/api/players/'); //Note to self: feetches as an ARRAY // Also should switch this to player ID at some point
      const playerData = await playerResponse.json();
      //console.log(playerData[0]); //Array
      setAllPlayers(playerData.map(player => ({
      label: `${player.name}`,
      value: player._id.toString(),
    })));
      if (playerID) {
        //Find the player with the matching ID
        setSelectedPlayer(playerData.find(player => player._id === playerID))
        fetchPlayerData(playerData.find(player => player._id === playerID)._id);
      } else if (playerData.length > 0) {
        setSelectedPlayer(playerData[0]); //What about jersey number that no exis?
        fetchPlayerData(playerData[0]._id);
      }
      //console.log(selectedPlayer);
    } catch (error){
      console.error("Failed to player data: ", error);
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


useEffect(() => {
  setFilteredDrills(allDrills.filter(drill => drill.practice_id === selectedSession)
    .map(drill => ({
      label: `${drill.name}`,
      value: drill._id.toString(),
    })));

  if (selectedDrill) {
    // Filter tempos for the selected drill
    updateTempoData();
    //Filter shots for the selected drill
    updateShotData();
  }
  //submitTempo();
}, [selectedSession, selectedDrill, allDrills, allTempos, allShots]);

  const statCardsData = [
    { title: "3 Pt FG %", value: "22.2" }, // Points per game
    { title: "2 Pt FG %", value: "77.5" },  // Assists per game
    { title: "Rebounds", value: "50.1" },  // Rebounds per game
    { title: "Steals", value: "8.2" },   // Steals per game
  ];

  //This is placeholder data for the eventual additional stats we will be adding
  const teamStatsData = {
    headers: ["GP", "MPG", "PPG", "FGM", "FGA", "FG%", "3PM", "3PA", "3P%", "ORB", "DRB", "RPG", "APG", "SPG", "BPG", "TOV", "PF"],
    rows: [
      ["56", "48.0", "123.7", "46.8", "92.2", ".508", "13.6", "35.8", ".381", "10.0", "30.6", "40.6", "30.9", "7.8", "5.8", "13.4", "21.9"],
      // ... Add as many rows as needed
    ]
  };

  const pointSectionLabels = ["2 pt FG %", "3 pt FG %"]; //This is for the shot point data
  const sectionLabels = ["30-20", "20-10", "10-0"]; //This is for the shot clock data

  const handlePlayerChange = (event) => {
    const newPlayerID = event.target.value;
    setSelectedPlayer(newPlayerID);

    setSelectedPlayer(allPlayers.find(player => player._id === playerID))

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

    // Update the URL with the new session ID
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('sessionId', newSessionId);
    window.history.pushState(null, '', `${window.location.pathname}?${urlParams}`);

    // Immediately filter drills for the newly selected session and set the first drill as selected
    // This assumes allDrills has been previously populated with all available drills
    const sessionDrills = allDrills.filter(drill => drill.practice_id === newSessionId);
    if (sessionDrills.length > 0) {
      const firstDrillId = sessionDrills[0]._id.toString();
      setSelectedDrill(firstDrillId);
      handleDrillChange({ target: { value: firstDrillId } }); //An attempt?

      // Optionally, update the URL with the new drill ID as well
      urlParams.set('drillId', firstDrillId);
      window.history.pushState(null, '', `${window.location.pathname}?${urlParams}`);
    } else {
      // If no drills are found for the selected session, clear the selected drill
      setSelectedDrill('');
      console.log("This is where the code went")
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

    setBarChartData({
      labels,
      datasets: [
        {
          label: '% of Shots Made by Zone',
          backgroundColor: 'rgba(255, 215, 0, 0.6)',
          borderColor: 'rgba(0,0,0,1)',
          borderWidth: 1,
          data,
        },
      ],
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
  
  return (
    <div className="team-stats-container">
    <button className='btn-home top-right-button' onClick={() => navigate('/homepage')}>Home</button>
      <div className="selectors">
      <Selector
          options={allPlayers}
          onChange={handlePlayerChange}
          label="Player"
          value={selectedPlayer}
        />
      <Selector
          options={sessions}
          onChange={handleSessionChange}
          label="Session"
          value={selectedSession}
        />
        <Selector
          options={filteredDrills}
          onChange={handleDrillChange}
          label="Drill"
          value={selectedDrill}
          disabled={!selectedSession}
        />
      </div>

      <div className="detailed-stats">
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
        
    </div>
  );
}

export default PlayerStats;