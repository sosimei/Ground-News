import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Navbar from './components/layout/Navbar';
import PageNotFound from './components/layout/PageNotFound';

// Lazy load components
const HomePage = lazy(() => import('./components/HomePage'));
const ClusterList = lazy(() => import('./components/news/ClusterList'));
const ClusterDetail = lazy(() => import('./components/news/ClusterDetail'));
const About = lazy(() => import('./components/About'));
const Dashboard = lazy(() => import('./components/Dashboard'));

// Loading component
const LoadingScreen = () => (
  <div className="loading">
    <div className="loading-spinner"></div>
  </div>
);

// PageTransition component to handle page changes
const PageTransition = ({ children }) => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      {children}
    </Suspense>
  );
};

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <PageTransition>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/news" element={<ClusterList />} />
            <Route path="/news/:clusterId" element={<ClusterDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </PageTransition>
      </div>
    </Router>
  );
}

export default App;