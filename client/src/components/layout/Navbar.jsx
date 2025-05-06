import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          바이어스 뉴스
        </Link>
        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            홈
          </NavLink>
          <NavLink to="/news" className={({ isActive }) => isActive ? 'active' : ''}>
            뉴스
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            통계
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>
            소개
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;