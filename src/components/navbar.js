import React from 'react';
import { Activity, Save, FilePlus, Wand2, Play, Search, Zap } from 'lucide-react';
import './navbar.css';

const Navbar = ({ onSave, onRun, onCheck, onFormat, onNewFile, isLoading, backendStatus }) => {
  return (
    <nav className="top-navbar">
      <div className="nav-brand">
        <Activity size={20} color="#58a6ff" />
        <span className="brand-name">CleanCodeX</span>
        <div className={`conn-dot ${backendStatus === 'connected' ? 'online' : 'offline'}`} title={`Backend: ${backendStatus}`} />
      </div>

      <div className="nav-menus">
        <span className="nav-menu-item">File</span>
        <span className="nav-menu-item">Edit</span>
        <span className="nav-menu-item">View</span>
        <span className="nav-menu-item">Run</span>
      </div>

      <div className="nav-search">
        <Search size={13} />
        <input type="text" placeholder="Search files..." />
      </div>

      <div className="nav-actions">
        <button className="nav-btn" onClick={onNewFile} title="New File" disabled={isLoading}>
          <FilePlus size={17} />
          <span>New</span>
        </button>
        <button className="nav-btn" onClick={onSave} title="Save" disabled={isLoading}>
          <Save size={17} />
          <span>Save</span>
        </button>
        <button className="nav-btn accent" onClick={onFormat} title="Auto Format" disabled={isLoading}>
          <Wand2 size={17} />
          <span>Format</span>
        </button>
        <div className="nav-divider" />
        <button className="nav-btn lint" onClick={onCheck} title="Analyze Code" disabled={isLoading}>
          <Zap size={17} />
          <span>Analyze</span>
        </button>
        <button className="nav-btn run" onClick={onRun} title="Run Code" disabled={isLoading}>
          <Play size={17} fill="currentColor" />
          <span>Run</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
