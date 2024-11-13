// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuthProvider from './hooks/AuthProvider';
import Home from './pages/Home/Home';
import TeamStats from './pages/TeamStats/TeamStats';
import PlayerStats from './pages/PlayerStats/PlayerStats';
import Practice from './pages/Practice/Practice';
import Drill from './pages/Drill/Drill'
import MainLayout from './layouts/MainLayout';
import ExportPage from './pages/ExportPage';
import SeasonPage from './pages/CreateSeason/CreateSeason';
import LoginPage from './pages/Login/LoginPage';
import PrivateRoute from './private/privateRoute';
import Game from './pages/Game/Game';
import Settings from './pages/Settings/Settings';



const App = () => {
  return (
  <div>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route element={<PrivateRoute/>}>
            <Route element={<MainLayout/>}>
              <Route path="/homepage" element={<Home />} exact />
              <Route path="/playerstats" element={<PlayerStats />} />
              <Route path="/teamstats" element={<TeamStats />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/drill" element={<Drill />} />
              <Route path="/export" element={<ExportPage />} />
              <Route path="/game" element={<Game />} />
              <Route path="/season" element={<SeasonPage />} />
            </Route>
            </Route>
          </Routes>
        </AuthProvider>
  </div>
  );
};

export default App;

