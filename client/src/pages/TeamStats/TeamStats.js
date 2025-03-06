import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2'; // For displaying bar charts
import Chart from 'chart.js/auto'; // Auto-import necessary for Chart.js to function correctly
import { useNavigate } from 'react-router-dom'; // Hook for navigating between routes
import './TeamStats.css'; // Import the CSS file for styling
import Selector from './components/Selector'; // Custom component for selection dropdowns
import ShotsByClock from './components/ShotsByClock'; // Displays shots by clock - not currently used, but kept as import
import StatCard from './components/StatsDisplay'; // Displays stat cards - not currently used, but kept as import
import TempoCard from './components/TempoCard'; // Displays tempo stats - not currently used, but kept as import


// Mapping object for player names to image paths
const playerImages = {
  'Reghan Grimes': '../../images/Reghan_Grimes.jpg',
  // ... add other players and their images ...
};


// Configuration options for the bar chart
const chartOptions = {
  maintainAspectRatio: false, // Allows the chart to resize without maintaining its aspect ratio
  scales: {
    y: {
      beginAtZero: true, // Start the Y axis at 0
      title: {
        display: true, // Display the Y axis title
        text: '% of Shots Made by Zone', // Y axis title text
        color: 'white' // Change Y axis title color to white
      },
      suggestedMin: 0,
      suggestedMax: 100,
      ticks: {
        stepSize: 20,
        color: 'white', // Change Y axis numbers to white
        callback: function(value) {
          return value;
        }
      },
      grid: {
        color: 'white', // Change Y axis grid lines to white
      }
    },
    x: {
      ticks: {
        color: 'white', // Change X axis numbers to white
        callback: function (value) {
          return value + 1; // Format X axis ticks (add empty string to convert to string)
        },
      },
      title: {
        display: true, // Display the X axis title
        text: 'Zones', // X axis title text
        color: 'white' // Change X axis title color to white
      },
      grid: {
        color: 'white', // Change X axis grid lines to white
      }
    },
  },
  plugins: {
    legend: {
      display: false, // Hide the legend
    },
  },
};

/**
 * TeamStats Component:
 * Fetches and displays team statistics based on selected season, practice, and drill.
 * Includes data fetching, state management, and rendering of UI elements.
 */
function TeamStats() {
  // --- State Variables ---
  const serverUrl = process.env.REACT_APP_SERVER_URL; // Retrieve server URL from environment variables
  const [seasons, setSeasons] = useState([]); // State for storing seasons data
  const [selectedSeason, setSelectedSeason] = useState(''); // State for storing the selected season ID
  const [practices, setPractices] = useState([]); // State for storing practices data
  const [selectedPractice, setSelectedPractice] = useState(''); // State for storing the selected practice ID
  const [drills, setDrills] = useState([]); // State for storing drills data
  const [selectedDrill, setSelectedDrill] = useState(''); // State for storing the selected drill ID
  const [avgOffensiveTempo, setAvgOffensiveTempo] = useState(0); // State for storing the average offensive tempo
  const [avgDefensiveTempo, setAvgDefensiveTempo] = useState(0); // State for storing the average defensive tempo
  const navigate = useNavigate(); // Hook for navigating between routes
  const [barChartData, setBarChartData] = useState({
    // State for storing bar chart data
    labels: ['1', '2', '3', '4', '5', '6', '7', '8'], // Initial labels for the zones
    datasets: [
      {
        backgroundColor: 'rgba(211, 211, 211, 0.8)', // Background color of the bars
        borderColor: 'rgba(169, 169, 169, 1)', // Border color of the bars
        borderWidth: 1, // Border width of the bars
        data: [0, 0, 0, 0, 0, 0, 0, 0], // Initial data for the bars
      },
    ],
  });


  // Function to get image path based on player name
  const getImagePath = (playerName) => {
    const imageName = playerImages[playerName];
    if (imageName) {
      return imageName; // Images are in the public/images directory
    } else {
      console.warn(`Image not found for ${playerName}`);
      return 'profile-placeholder.png'; // Fallback image
    }
  };
  // --- Data Fetching Functions ---

  /**
   * Fetches seasons data from the server.
   */
  const fetchSeasons = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/seasons`);// Fetch seasons from the server
      const data = await response.json(); // Parse the response as JSON
      setSeasons(data); // Update the seasons state with the fetched data
      if (data.length > 0) {
        setSelectedSeason(data[0]._id); // Select the first season by default
        fetchPractices(data[0]._id); // Fetch practices for the selected season
      }
    } catch (error) {
      console.error('Failed to fetch seasons:', error); // Log any errors to the console
    }
  };

  /**
   * Fetches practices data for a given season ID.
   * @param {string} seasonId - The ID of the season.
   */
  const fetchPractices = async (seasonId) => {
    try {
      const response = await fetch(`${serverUrl}/api/practices/bySeason/${seasonId}`);
      const data = await response.json(); // Parse the response as JSON
      setPractices(data); // Update the practices state with the fetched data
      if (data.length > 0) {
        setSelectedPractice(data[0]._id); // Select the first practice by default
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
      const response = await fetch(`${serverUrl}/api/drills/practice/${practiceId}`); // Fetch drills for the given practice ID
      const data = await response.json(); // Parse the response as JSON
      setDrills(data); // Update the drills state with the fetched data
      if (data.length > 0) {
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
   * Fetches shots data for a given drill ID.
   * @param {string} drillId - The ID of the drill.
   */
  const fetchShots = async (drillId) => {
    try {
      const response = await fetch(`${serverUrl}/api/shots`);// Fetch all shots
      const allShots = await response.json(); // Parse the response as JSON
      const filteredShots = allShots.filter((shot) => shot.gameOrDrill_id === drillId); // Filter shots by the selected drill ID
      processShotsForChart(filteredShots); // Process the filtered shots for the chart
    } catch (error) {
      console.error('Failed to fetch shots:', error); // Log any errors to the console
    }
  };

  /**
   * Processes the filtered shots data to calculate shot percentages by zone.
   * @param {Array} filteredShots - An array of shot objects filtered by drill ID.
   */
  const processShotsForChart = (filteredShots) => {
    const shotCountsByZone = {}; // Object to store shot counts by zone
    for (var i = 1; i <= 8; i++) {
      shotCountsByZone[i] = { made: 0, total: 0 }; // Initialize shot counts for each zone
    }

    filteredShots.forEach((shot) => {
      shotCountsByZone[shot.zone].total += 1; // Increment the total shots for the zone
      if (shot.made) {
        shotCountsByZone[shot.zone].made += 1; // Increment the made shots for the zone if the shot was made
      }
    });

    const labels = []; // Array to store labels for the chart
    const data = []; // Array to store data for the chart
    const backgroundColor = [] //New array for bar colors

    for (let i = 1; i <= 8; i++) {
      labels.push(`Zone ${i}`); // Add zone label
      const { made, total } = shotCountsByZone[i]; // Destructure made and total shots for the zone
      const percentage = total > 0 ? (made / total) * 100 : 0; // Calculate the percentage of shots made
      data.push(percentage.toFixed(2)); // Add the percentage to the data array
    }

      
    setBarChartData({
      // Update the bar chart data state
      labels,
      datasets: [
        {
          label: '% of Shots Made by Zone', // Label for the dataset
          backgroundColor,
          borderColor: 'rgb(0, 0, 0)', // Border color of the bars
          borderWidth: 1, // Border width of the bars
          data, // Data for the bars
        },
      ],
    });
  };

  // --- Event Handlers ---

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
   * Handles the change event for the drill selector.
   * @param {Event} e - The change event object.
   */
  const handleDrillChange = (e) => {
    const newSelectedDrill = e.target.value; // Get the newly selected drill ID from the event
    setSelectedDrill(newSelectedDrill); // Update the selected drill state
    fetchTempos(newSelectedDrill); // Fetch tempos for the selected drill
    fetchShots(newSelectedDrill); // Fetch shots for the selected drill
  };

  // --- Render ---
  return (
    <div className="team-stats-container">
      {/* Home button to navigate to the homepage */}
      <button className="btn-home top-right-button" onClick={() => navigate('/homepage')}>
        Home
      </button>

      {/* Selectors for season, practice, and drill */}
      <div className="selectors">
        <Selector
          options={seasons}
          value={selectedSeason}
          onChange={handleSeasonChange}
          label="Season"
        />
        <Selector
          options={practices}
          value={selectedPractice}
          onChange={handlePracticeChange}
          label="Practice"
        />
        <Selector
          options={drills}
          value={selectedDrill}
          onChange={handleDrillChange}
          label="Drill"
        />
      </div>

      {/* Team Leaders Section */}
      <div className="team-leaders">
        <h3>Team Leaders</h3>
        <div className="leader-container">
          <div className="leader-category">
            <h4>Points</h4>
            <img src={getImagePath('Reghan Grimes')} alt="Player Image" />
            <p>
              <strong>Reghan Grimes G</strong>
            </p>
            <p className="stat">12.0</p>
          </div>
          <div className="leader-category">
            <h4>Rebounds</h4>
            <img src="profile-placeholder.png" alt="Player Image" />
            <p>
              <strong>Anna Walker F</strong>
            </p>
            <p className="stat">9.2</p>
          </div>
          <div className="leader-category">
            <h4>Assists</h4>
            <img src="profile-placeholder.png" alt="Player Image" />
            <p>
              <strong>Peyton Carter G</strong>
            </p>
            <p className="stat">3.2</p>
          </div>
          <div className="leader-category">
            <h4>Steals</h4>
            <img src="profile-placeholder.png" alt="Player Image" />
            <p>
              <strong>Reghan Grimes G</strong>
            </p>
            <p className="stat">2.5</p>
          </div>
          <div className="leader-category">
            <h4>Blocks</h4>
            <img src="profile-placeholder.png" alt="Player Image" />
            <p>
              <strong>Anna Walker F</strong>
            </p>
            <p className="stat">2.2</p>
          </div>
        </div>
      </div>

      {/* Content wrapper for charts and other content */}
      <div className="content-wrapper">
        <div className="other-content">
          {/* Add other content here if needed */}
        </div>

        {/* Bar chart displaying shot percentages by zone */}
        <div className="charts-container">
          <Bar data={barChartData} options={chartOptions} />
        </div>
      </div>

      {/* Tempo statistics display */}
      <div className="tempo-stats">
        <div className="tempo-stats-card">
          <div className="tempo-label">Average Offensive Tempo</div>
          <div className="tempo-value">{avgOffensiveTempo}</div>
        </div>
        <div className="tempo-stats-card">
          <div className="tempo-label">Average Defensive Tempo</div>
          <div className="tempo-value">{avgDefensiveTempo}</div>
        </div>
      </div>
    </div>
  );
}

export default TeamStats;
