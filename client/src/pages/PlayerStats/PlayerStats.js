import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2'; // For displaying bar charts
import { useNavigate } from 'react-router-dom';
import Selector from '../TeamStats/components/Selector';
import Heatmap from '../TeamStats/components/Heatmap';
import TempoCard from '../TeamStats/components/TempoCard';
import StatCard from '../TeamStats/components/StatsDisplay';
import Headshot from '../../images/KD.png';
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

  const sessionIdParam  = urlParams.get('seasonId');
  const session = urlParams.get('session');
  const drillIdParam = urlParams.get('drillId');
  const playerID  = urlParams.get('playerID');
  const [selectedPlayer, setSelectedPlayer] = useState(''); //
  const serverUrl = process.env.REACT_APP_SERVER_URL;


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
    {name: "3", shape: "poly", coords: [25, 1.5, 26, 20, 29, 40, 105, 40, 105, 1.5].map((n, i) => i % 2 === 0 ? n * 1.3333 : n * 1.2245), fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "green"},
    {name: "2", shape: "poly", coords: [193, 1.5, 193, 40, 270, 40, 273, 20, 275, 1.5].map((n, i) => i % 2 === 0 ? n * 1.3333 : n * 1.2245), fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "green"},
    {name: "1", shape: "poly", coords: [108, 1.5, 108, 102, 190, 102, 190, 1.5].map((n, i) => i % 2 === 0 ? n * 1.3333 : n * 1.2245), fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "purple"},
    {name: "5", shape: "poly", coords: [30, 45, 103, 45, 103, 107, 150, 107, 150, 141, 126, 138, 115, 135, 110, 134, 100, 131, 95, 129, 90, 127, 85, 125, 74, 117, 65, 110, 40, 78, 38, 70].map((n, i) => i % 2 === 0 ? n * 1.3333 : n * 1.2245), fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "red"},
    {name: "4", shape: "poly", coords: [30, 45, 108, 45, 108, 107, 150, 107, 150, 141, 126, 138, 115, 135, 110, 134, 100, 131, 95, 129, 90, 127, 85, 125, 74, 117, 65, 110, 40, 78, 38, 70].map((n, i) => i % 2 === 0 ? (300 - n) * 1.3333 : n * 1.2245), fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "red"},
    {name: "8", shape: "poly", coords: [80, 127, 0, 250, 300, 250, 220, 127, 205, 134, 180, 141, 150, 145, 122, 142, 98, 135].map((n, i) => i % 2 === 0 ? n * 1.3333 : n * 1.2245), fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "blue"},
    {name: "7", shape: "poly", coords: [0, 1.5, 20, 1.5, 23, 34, 35, 75, 40, 85, 45, 92, 50, 99, 55, 105, 60, 110, 65, 116, 70, 120, 79, 127, 0, 250].map((n, i) => i % 2 === 0 ? n * 1.3333 : n * 1.2245), fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "blue"},
    {name: "6", shape: "poly", coords: [300, 1.5, 278, 1.5, 275, 34, 265, 75, 260, 85, 255, 92, 250, 99, 245, 105, 240, 110, 235, 116, 230, 120, 221, 127, 300, 250].map((n, i) => i % 2 === 0 ? n * 1.3333 : n * 1.2245), fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "blue"}
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
        <div className='layout-container'>
          <div className="player-headshot">
            <img src={Headshot} alt="Player Headshot" />
          </div>
          <div className="bio-text">
              <p><strong>Name:</strong> Kevin Durant</p>
              <p><strong>Position:</strong> PF</p>
              <p><strong>Born:</strong> 9/29/1988</p>
              <p><strong>From:</strong> Suitland, MD</p>
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