import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2'; // For displaying bar charts
import Chart from 'chart.js/auto'; // Auto-import necessary for Chart.js to function correctly
import { random } from 'lodash'; // Utility for generating random values (used for demo purposes)
import NavigationHeader from './components/NavigationHeader'; // Custom component for navigation header
import Selector from './components/Selector'; // Custom component for selection dropdowns
import TempoCard from './components/TempoCard'; // Displays tempo stats
import ShotsByClock from './components/ShotsByClock';
import StatCard from './components/StatsDisplay'; 
import './TeamStats.css';

const chartOptions = {
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Percentage'
      }
    },
    x: {
      ticks: {
        callback: function(value) {
          return value + '';
        }
      },
      title: {
        display: true,
        text: 'Zones'
      }
    }
  },
  plugins: {
    legend: {
      display: false
    }
  }
};

function TeamStats() {
  const serverUrl = process.env.REACT_APP_SERVER_URL;
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [practices, setPractices] = useState([]);
  const [selectedPractice, setSelectedPractice] = useState('');
  const [drills, setDrills] = useState([]);
  const [selectedDrill, setSelectedDrill] = useState('');
  const [avgOffensiveTempo, setAvgOffensiveTempo] = useState(0);
  const [avgDefensiveTempo, setAvgDefensiveTempo] = useState(0);
  const [barChartData, setBarChartData] = useState({
    labels: ['0', '20', '40', '60', '80', '100'],
    datasets: [{
      backgroundColor: 'rgba(211, 211, 211, 0.8)',
      borderColor: 'rgba(169, 169, 169, 1)',
      borderWidth: 1,
      data: [0, 0, 0, 0, 0, 0, 0, 0],
    }]
  });

  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/seasons`);
      const data = await response.json();
      setSeasons(data);
      if (data.length > 0) {
        setSelectedSeason(data[0]._id);
        fetchPractices(data[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch seasons:', error);
    }
  };

  const fetchPractices = async (seasonId) => {
    try {
      const response = await fetch(`${serverUrl}/api/practices/bySeason/${seasonId}`);
      const data = await response.json();
      setPractices(data);
      if (data.length > 0) {
        setSelectedPractice(data[0]._id);
        fetchDrills(data[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch practices:', error);
    }
  };

  const fetchDrills = async (practiceId) => {
    try {
      const response = await fetch(`${serverUrl}/api/drills/practice/${practiceId}`);
      const data = await response.json();
      setDrills(data);
      if (data.length > 0) {
        setSelectedDrill(data[0]._id);
        fetchTempos(data[0]._id);
        fetchShots(data[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch drills:', error);
    }
  };

  const fetchTempos = async (drillId) => {
    try {
      const response = await fetch(`${serverUrl}/api/tempos/byGameOrDrill/${drillId}`);
      const tempoData = await response.json();
      calculateAvgTempo(tempoData);
    } catch (error) {
      console.error('Failed to fetch tempos:', error);
    }
  };

  const calculateAvgTempo = (tempoData) => {
    const offensiveTempos = tempoData.filter(tempo => tempo.tempo_type === 'offensive');
    const defensiveTempos = tempoData.filter(tempo => tempo.tempo_type === 'defensive');
    const offensiveTempoAvg = offensiveTempos.length > 0 ? offensiveTempos.reduce((total, tempo) => total + tempo.transition_time, 0) / offensiveTempos.length : 0;
    const defensiveTempoAvg = defensiveTempos.length > 0 ? defensiveTempos.reduce((total, tempo) => total + tempo.transition_time, 0) / defensiveTempos.length : 0;
    setAvgOffensiveTempo(offensiveTempoAvg.toFixed(2));
    setAvgDefensiveTempo(defensiveTempoAvg.toFixed(2));
  };

  const fetchShots = async (drillId) => {
    try {
      const response = await fetch(`${serverUrl}/api/shots`);
      const allShots = await response.json();
      const filteredShots = allShots.filter(shot => shot.gameOrDrill_id === drillId);
      processShotsForChart(filteredShots);
    } catch (error) {
      console.error('Failed to fetch shots:', error);
    }
  };

  const processShotsForChart = (filteredShots) => {
    const shotCountsByZone = {};
    for(var i = 1; i <= 8; i++) {
      shotCountsByZone[i] = {made: 0, total: 0};
    }
  
    filteredShots.forEach(shot => {
      shotCountsByZone[shot.zone].total += 1;
      if (shot.made) {
        shotCountsByZone[shot.zone].made += 1;
      }
    });
  
    const labels = [];
    const data = [];
    for (let i = 1; i <= 8; i++) {
      labels.push(`Zone ${i}`);
      const { made, total } = shotCountsByZone[i];
      const percentage = total > 0 ? (made / total) * 100 : 0;
      data.push(percentage.toFixed(2));
    }
  
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

  const handleSeasonChange = (e) => {
    const newSelectedSeason = e.target.value;
    setSelectedSeason(newSelectedSeason);
    fetchPractices(newSelectedSeason);
  };

  const handlePracticeChange = (e) => {
    const newSelectedPractice = e.target.value;
    setSelectedPractice(newSelectedPractice);
    fetchDrills(newSelectedPractice);
  };

  const handleDrillChange = (e) => {
    const newSelectedDrill = e.target.value;
    setSelectedDrill(newSelectedDrill);
    fetchTempos(newSelectedDrill);
    fetchShots(newSelectedDrill);
  };



  return (
  <div className="team-stats-container">
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
    

    <div class="team-leaders">
  <h3>Team Leaders</h3>
  <div class="leader-container">
    <div class="leader-category">
      <h4>Points</h4>
      <img src="profile-placeholder.png" alt="Player Image" />
      <p><strong>Reghan Grimes G</strong></p>
      <p class="stat">12.0</p>
    </div>
    <div class="leader-category">
      <h4>Rebounds</h4>
      <img src="profile-placeholder.png" alt="Player Image" />
      <p><strong>Anna Walker F</strong></p>
      <p class="stat">9.2</p>
    </div>
    <div class="leader-category">
      <h4>Assists</h4>
      <img src="profile-placeholder.png" alt="Player Image" />
      <p><strong>Peyton Carter G</strong></p>
      <p class="stat">3.2</p>
    </div>
    <div class="leader-category">
      <h4>Steals</h4>
      <img src="profile-placeholder.png" alt="Player Image" />
      <p><strong>Reghan Grimes G</strong></p>
      <p class="stat">2.5</p>
    </div>
    <div class="leader-category">
      <h4>Blocks</h4>
      <img src="profile-placeholder.png" alt="Player Image" />
      <p><strong>Anna Walker F</strong></p>
      <p class="stat">2.2</p>
    </div>
  </div>
</div>


    <div className="content-wrapper">
      <div className="other-content">
        {/* Add other content here if needed */}
      </div>
      <div className="charts-container">
        <Bar data={barChartData} options={chartOptions} />
      </div>
    </div>
    <div className="tempo-stats">
      <div className="tempo-stats-card">
        <div className="tempo-label">Average Offensive Tempo</div>
        <div className="tempo-value">{avgOffensiveTempo}</div>
      </div>
      <div className="tempo-stats-card">
        <div className="tempo-label">Average Defensive Tempo</div>
        <div className="tempo-value">{avgDefensiveTempo}</div>
      </div>


      {/* /* New Stats Cards
    <div className="new-stats-card">
      <div className="tempo-label">Stat 1</div>
      <div className="tempo-value">123</div>
    </div>
    <div className="new-stats-card">
      <div className="tempo-label">Stat 2</div>
      <div className="tempo-value">456</div>
    </div> */}

    
    </div>
  </div>
);
}

export default TeamStats;