import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2'; // For displaying bar charts
import Chart from 'chart.js/auto'; // Auto-import necessary for Chart.js to function correctly
import { random } from 'lodash'; // Utility for generating random values (used for demo purposes)
import NavigationHeader from './components/NavigationHeader'; // Custom component for navigation header
import Selector from './components/Selector'; // Custom component for selection dropdowns
import TempoCard from './components/TempoCard'; // Displays tempo stats
import ShotsByClock from './components/ShotsByClock';
import StatCard from './components/StatsDisplay'; // Displays various statistics
import './TeamStats.css'; // Stylesheet for the TeamStats component
import { useNavigate } from 'react-router-dom';

// Configuration options for Chart.js bar charts
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

function TeamStats() {
  const serverUrl = process.env.REACT_APP_SERVER_URL;
  // State variables for storing fetched data and user selections
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [practices, setpractices] = useState([]);
  const [selectedpractice, setSelectedpractice] = useState('');
  const [drills, setDrills] = useState([]);
  const [selectedDrill, setSelectedDrill] = useState('');

  // State variables for statistics calculations
  const [avgOffensiveTempo, setAvgOffensiveTempo] = useState(0);
  const [avgDefensiveTempo, setAvgDefensiveTempo] = useState(0);
  const [TotalPoints, setTotalPoints] = useState(0);
  const [ThreePointPercentage, setThreePointPercentage] = useState(0);
  const [TwoPointPercentage, setTwoPointPercentage] = useState(0);
  const [shotClockData, setShotClockData] = useState([]);

  const sectionLabels = ["0-10", "10-20", "20-30"]; //This is for the shot clock data

  const navigate = useNavigate();

  // Initial state for bar chart data, with dummy values replaced later
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

  // Fetches the list of seasons from the server
  const fetchSeasons = async () => {
    try {
      const response = await fetch(serverUrl + '/api/seasons');
      const data = await response.json();
      setSeasons(data);
    } catch (error) {
      console.error('Failed to fetch seasons:', error);
    }
  };

  // Fetches practices for a given season ID
  const fetchpractices = async (seasonID) => {
    try {
      console.log(serverUrl);
      const response = await fetch(serverUrl + `/api/practices/bySeason/${seasonID}`);
      const data = await response.json();
      setpractices(data);
    } catch (error) {
      console.error('Failed to fetch practices:', error);
    }
  };

  // Fetches drills for a given practice ID
  const fetchDrills = async (practiceID) => {
    try {
      const response = await fetch(serverUrl + `/api/drills/practice/${practiceID}`);
      const data = await response.json();
      setDrills(data);
      console.log(data);
    } catch (error) {
      console.error('Failed to fetch drills:', error);
    }
  };

  //Fetches tempos for a given game or drill ID
  const fetchTempos = async (gameOrDrillId) => {
    try {
      const response = await fetch(serverUrl + `/api/tempos/byGameOrDrill/${gameOrDrillId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const tempoData = await response.json();

      calculateAvgTempo(tempoData);
    } catch (error) {
      console.error('Failed to fetch tempos:', error);
    }
  };

  // Calculate average offensive and defensive tempos
  const calculateAvgTempo = (tempoData) => {

    const offensiveTempos = tempoData.filter(tempo => tempo.tempo_type === 'offensive');
    const defensiveTempos = tempoData.filter(tempo => tempo.tempo_type === 'defensive');

    const offensiveTempoSum = offensiveTempos.reduce((total, tempo) => total + tempo.transition_time, 0);
    const defensiveTempoSum = defensiveTempos.reduce((total, tempo) => total + tempo.transition_time, 0);

    const offensiveTempoAvg = offensiveTempos.length > 0 ? offensiveTempoSum / offensiveTempos.length : 0;
    const defensiveTempoAvg = defensiveTempos.length > 0 ? defensiveTempoSum / defensiveTempos.length : 0;

    setAvgOffensiveTempo(offensiveTempoAvg.toFixed(2));
    setAvgDefensiveTempo(defensiveTempoAvg.toFixed(2));
  };

  // Fetch all shots
  const fetchShots = async (gameOrDrillId) => {
    try {
      const response = await fetch(serverUrl + `/api/shots`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const allShots = await response.json();

      // Filtering by gameOrDrillId on the client side
      const filteredShots = allShots.filter(shot => shot.gameOrDrill_id === gameOrDrillId);

      // Initialize counters
      let totalPoints = 0;
      let twoPointAttempts = 0;
      let twoPointMade = 0;
      let threePointAttempts = 0;
      let threePointMade = 0;

      filteredShots.forEach(shot => {
        if (shot.zone >= 1 && shot.zone <= 5) { // 2-point shots
          twoPointAttempts++;
          if (shot.made) {
            twoPointMade++;
            totalPoints += 2;
          }
        } else if (shot.zone >= 6 && shot.zone <= 8) { // 3-point shots
          threePointAttempts++;
          if (shot.made) {
            threePointMade++;
            totalPoints += 3;
          }
        }
      });

      // Calculate percentages
      const twoPointPercentage = twoPointAttempts > 0 ? (twoPointMade / twoPointAttempts) * 100 : 0;
      const threePointPercentage = threePointAttempts > 0 ? (threePointMade / threePointAttempts) * 100 : 0;

      // Update state with calculated values
      setTotalPoints(totalPoints);
      setThreePointPercentage(threePointPercentage.toFixed(2));
      setTwoPointPercentage(twoPointPercentage.toFixed(2));

      processShotsForChart(filteredShots);



      // Calculate shot clock data
      var shotClockData = [[0, 0], [0, 0], [0, 0]]; // Initialize counters for each section of the shot clock

      filteredShots.forEach(shot => {
        if (shot.shot_clock_time == 'final_third') {
          shotClockData[0][1] += 1;
          if (shot.made) {
            shotClockData[0][0] += 1;
          }
        } else if (shot.shot_clock_time == 'first_third') {
          shotClockData[1][1] += 1;
          if (shot.made) {
            shotClockData[1][0] += 1;
          }
        } else {
          shotClockData[2][1] += 1;
          if (shot.made) {
            shotClockData[2][0] += 1;
          }
        }
      });

      console.log(shotClockData);

      setShotClockData(shotClockData);

    } catch (error) {
      console.error('Failed to fetch shots:', error);
    }
  };

  const processShotsForChart = (filteredShots) => {
    const shotCountsByZone = {}; // Object to hold counts of made and total shots by zone

    for(var i = 1; i < 9; i++)
      shotCountsByZone[i] = {made: 0, total: 0}; //This is gross and allows the bar graph to display all zones, even when no shots are made in a zone.  

    filteredShots.forEach(shot => {
      if (!shotCountsByZone[shot.zone]) {
        shotCountsByZone[shot.zone] = { made: 0, total: 0 };
      }
      shotCountsByZone[shot.zone].total += 1;
      if (shot.made) {
        shotCountsByZone[shot.zone].made += 1;
      }
    });

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
  };

  const handleSeasonChange = async (e) => {
    const newSelectedSeason = e.target.value;
    setSelectedSeason(newSelectedSeason);
    await fetchpractices(newSelectedSeason);
  };

  const handlepracticeChange = async (e) => {
    const newSelectedpractice = e.target.value;
    setSelectedpractice(newSelectedpractice);
    await fetchDrills(newSelectedpractice);
  };

  const handleDrillChange = async (e) => {
    const newSelectedDrill = e.target.value;
    setSelectedDrill(newSelectedDrill);
    // Fetch tempos and calculate average tempos
    await fetchTempos(newSelectedDrill);
    await fetchShots(newSelectedDrill);
  };


  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch Seasons
      console.log(serverUrl);
      try {
        const response = await fetch(serverUrl + '/api/seasons');
        const seasonsData = await response.json();
        setSeasons(seasonsData);
        if (seasonsData.length > 0) {
          const defaultSeasonId = seasonsData[0]._id;
          setSelectedSeason(defaultSeasonId); // Set default season

          // Fetch practices for default season
          const practicesResponse = await fetch(serverUrl + `/api/practices/bySeason/${defaultSeasonId}`);
          const practicesData = await practicesResponse.json();
          setpractices(practicesData);
          if (practicesData.length > 0) {
            const defaultpracticeId = practicesData[0]._id;
            setSelectedpractice(defaultpracticeId); // Set default practice

            // Fetch Drills for default practice
            const drillsResponse = await fetch(serverUrl + `/api/drills/practice/${defaultpracticeId}`);
            const drillsData = await drillsResponse.json();
            setDrills(drillsData);
            if (drillsData.length > 0) {
              const defaultDrillId = drillsData[0]._id;
              setSelectedDrill(defaultDrillId); // Set default drill

              // Optionally, fetch tempos and shots for the default drill
              fetchTempos(defaultDrillId);
              fetchShots(defaultDrillId);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };

    fetchInitialData();
  }, []); // The empty dependency array ensures this effect runs only once after the initial render

  useEffect(() => {
    if (selectedSeason) {
      const fetchpracticesForSeason = async () => {
        try {
          const response = await fetch(serverUrl + `/api/practices/bySeason/${selectedSeason}`);
          const practicesData = await response.json();
          setpractices(practicesData);
          if (practicesData.length > 0) {
            setSelectedpractice(practicesData[0]._id); // Automatically select the first practice
          } else {
            setSelectedpractice('');
            setDrills([]); // Clear drills if no practices are available
          }
        } catch (error) {
          console.error('Failed to fetch practices:', error);
        }
      };

      fetchpracticesForSeason();
    }
  }, [selectedSeason]); // Re-fetch practices when selectedSeason changes

  useEffect(() => {
    if (selectedpractice) {
      const fetchDrillsForpractice = async () => {
        console.log(selectedpractice);
        try {
          const response = await fetch(serverUrl + `/api/drills/practice/${selectedpractice}`);
          const drillsData = await response.json();
          setDrills(drillsData);
          if (drillsData.length > 0) {
            setSelectedDrill(drillsData[0]._id); // Automatically select the first drill
            fetchTempos(drillsData[0]._id); // Fetch tempos for the first drill
            fetchShots(drillsData[0]._id); // Fetch shots for the first drill
          } else {
            setSelectedDrill('');
          }
        } catch (error) {
          console.error('Failed to fetch drills:', error);
        }
      };

      fetchDrillsForpractice();
    } else {
      setDrills([]); // Clear drills if no practice is selected
      // Optionally clear tempos and shots data as well
    }
  }, [selectedpractice]); // Re-fetch drills, tempos, and shots when selectedpractice changes

  return (
    <div className="team-stats-container">
    <button className='btn-home top-right-button' onClick={() => navigate('/homepage')}>Home</button>
      <div className="selectors">
        <Selector
          options={seasons.map(season => ({ label: `Season: ${season.year}`, value: season._id }))}
          onChange={handleSeasonChange}
          label="Season"
          value={selectedSeason}
        />
        <Selector
          options={practices.map(practice => {
            const date = new Date(practice.date);
            return { label: `Practice: ${date.toLocaleDateString()}`, value: practice._id };
          })}
          onChange={handlepracticeChange}
          label="Practice"
          value={selectedpractice}
          disabled={!selectedSeason} // Disable if no season is selected
        />
        <Selector
          options={drills.map(drill => ({ label: `Drill: ${drill.name}`, value: drill._id }))}
          onChange={handleDrillChange}
          label="Drill"
          value={selectedDrill}
          disabled={!selectedpractice} // Disable if no practice is selected
        />
      </div>

      <div className="detailed-stats">
        <div className="tempo-cards">
          <TempoCard title="Avg Offensive Tempo" tempo={avgOffensiveTempo} />
          <TempoCard title="Avg Defensive Tempo" tempo={avgDefensiveTempo} />
        </div>
        <div className="charts-container">
          <div className='bar-container'>
            <Bar
              data={barChartData}
              options={chartOptions}
            />
          </div>
          <div className='shotClock'>
            {shotClockData.map((section, index) => (
              <ShotsByClock key={index} made={section[0]} total={section[1]} section={sectionLabels[index]} />
            ))}
          </div>
        </div>
      </div>

      <div className="stats-overview">
        <StatCard title="Total Points" value={TotalPoints} />
        <StatCard title="3-Point %" value={ThreePointPercentage} />
        <StatCard title="2-Point %" value={TwoPointPercentage} />
      </div>
    </div>
  );
}

export default TeamStats;