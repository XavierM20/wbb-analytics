// src/api/apiService.js
const serverUrl = process.env.REACT_APP_SERVER_URL;
const API_BASE_URL = serverUrl + '/api';

export const fetchSeasons = async () => {
  const response = await fetch(`${API_BASE_URL}/seasons`);
  if (!response.ok) {
    throw new Error('Failed to fetch seasons');
  }
  return response.json();
};

export const fetchSessions = async (seasonId) => {
  const response = await fetch(`${API_BASE_URL}/sessions/season/${seasonId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }
  return response.json();
};

export const fetchDrills = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/drills/session/${sessionId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch drills');
  }
  return response.json();
};

export const fetchTempos = async (drillId) => {
  const response = await fetch(`${API_BASE_URL}/tempos/`);
  if (!response.ok) {
    throw new Error('Failed to fetch tempos');
  }
  const allTempos = await response.json();
  return allTempos.filter(tempo => tempo.gameOrDrill_id === drillId);
};

export const fetchShots = async (drillId) => {
  const response = await fetch(`${API_BASE_URL}/shots/`);
  if (!response.ok) {
    throw new Error('Failed to fetch shots');
  }
  const allShots = await response.json();
  return allShots.filter(shot => shot.gameOrDrill_id === drillId);
};
