import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import DestinationsPage from './pages/DestinationsPage';
import TripPlannerPage from './pages/TripPlannerPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/planner" element={<TripPlannerPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
