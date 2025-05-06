import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/layout/Navbar';
import HomePage from './components/HomePage';
import ClusterList from './components/news/ClusterList';
import ClusterDetail from './components/news/ClusterDetail';
import About from './components/About';
import Dashboard from './components/Dashboard';
import PageNotFound from './components/layout/PageNotFound';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/news" element={<ClusterList />} />
          <Route path="/news/:clusterId" element={<ClusterDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;