import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditorComponent from './components/editor';
import SuggestionsPanel from './components/suggestions';
import Sidebar from './components/sidebar';
import Navbar from './components/navbar';
import './dashboard.css';

const API = 'http://127.0.0.1:8000/api';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const Dashboard = () => {
  const navigate = useNavigate();
  const [explorerData, setExplorerData] = useState({ folders: [], orphan_files: [] });
  const [activeFile, setActiveFile] = useState(null);
  const [code, setCode] = useState('# Write your Python code here\nprint("Hello, CleanCodeX!")');
  const [suggestions, setSuggestions] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [qualityScore, setQualityScore] = useState(100);
  const [stats, setStats] = useState({ errors: 0, warnings: 0, info: 0, fixable: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing]= useState(false);
  const [output, setOutput] = useState(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [diffPreview, setDiffPreview] = useState(null);
  const debounceRef = useRef(null);

  // ── Auth & Init ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!getToken()) { navigate('/login'); return; }
    fetchExplorer();
    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  // Keyboard shortcuts forwarded from Monaco editor
  useEffect(() => {
    const onRun  = () => handleRun();
    const onSave = () => handleSave();
    window.addEventListener('editor-run',  onRun);
    window.addEventListener('editor-save', onSave);
    return () => {
      window.removeEventListener('editor-run',  onRun);
      window.removeEventListener('editor-save', onSave);
    };
  }); // intentionally no deps — always use latest handlers

  const checkBackend = async () => {
    try {
      await axios.get('http://127.0.0.1:8000/');
      setBackendStatus('connected');
    } catch { setBackendStatus('offline'); }
  };

  const fetchExplorer = async () => {
    try {
      const res = await axios.get(`${API}/files/explorer`, { headers: authHeaders() });
      setExplorerData(res.data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    }
  };

  // ── File Ops ─────────────────────────────────────────────────────────────
  const handleFileSelect = (file) => {
    setActiveFile(file);
    setCode(file.content || '');
    setSuggestions([]); setMarkers([]); setOutput(null);
    setShowTerminal(false); setDiffPreview(null);
    setStats({ errors: 0, warnings: 0, info: 0, fixable: 0 });
    setQualityScore(100);
  };

  const handleSave = async () => {
    if (!activeFile) { alert('No file selected.'); return; }
    try {
      await axios.put(`${API}/files/files/${activeFile.id}`,
        { name: activeFile.name, content: code, language: 'python' },
        { headers: authHeaders() }
      );
    } catch (err) { console.error('Save error:', err); }
  };

  const handleNewFile = async () => {
    const name = prompt('File name (e.g. main.py):');
    if (!name?.trim()) return;
    try {
      const res = await axios.post(`${API}/files/files`,
        { name: name.trim(), content: '# New file\n', language: 'python' },
        { headers: authHeaders() }
      );
      setExplorerData(prev => ({ ...prev, orphan_files: [res.data, ...prev.orphan_files] }));
      handleFileSelect(res.data);
    } catch (err) { console.error('New file error:', err); }
  };

  // ── Format ───────────────────────────────────────────────────────────────
  const handleFormat = async () => {
    setIsLoading(true);
    setDiffPreview(null);
    try {
      const res = await axios.post(`${API}/lint/format-diff`, { code });
      if (res.data.has_changes) {
        setCode(res.data.formatted_code);
        setDiffPreview(res.data.diff);
      }
    } catch (err) {
      // fallback to /format/format
      try {
        const r2 = await axios.post(`${API}/format/format`, { code });
        if (r2.data.formatted_code) setCode(r2.data.formatted_code);
      } catch {}
    } finally { setIsLoading(false); }
  };

  // ── Run ──────────────────────────────────────────────────────────────────
  const handleRun = async () => {
    setIsLoading(true);
    setShowTerminal(true);
    setOutput({ stdout: '', stderr: '', exit_code: null, status: 'running' });
    try {
      const res = await axios.post(`${API}/execute/execute`, { code });
      setOutput({ ...res.data, status: res.data.exit_code === 0 ? 'success' : 'error' });
    } catch (err) {
      setOutput({ stdout: '', stderr: err.message, exit_code: 1, status: 'error' });
    } finally { setIsLoading(false); }
  };

  // ── Analyze ──────────────────────────────────────────────────────────────
  const handleCheck = useCallback(async (codeToCheck) => {
    const src = codeToCheck ?? code;
    if (!src?.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await axios.post(`${API}/lint/check`, { code: src });
      const issues = res.data.issues || [];
      setQualityScore(res.data.quality_score ?? 100);
      setStats(res.data.stats || { errors: 0, warnings: 0, info: 0, fixable: 0 });
      setMarkers(issues);
      setSuggestions(issues.map((issue, idx) => ({ ...issue, id: idx })));
    } catch (err) { console.error('Lint error:', err); }
    finally { setIsAnalyzing(false); }
  }, [code]);

  // ── Live typing → debounced analysis ─────────────────────────────────────
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleCheck(newCode), 800);
  };

  // ── Fix One ──────────────────────────────────────────────────────────────
  const handleQuickFix = (suggestion) => {
    if (suggestion.fix?.kind === 'rename') {
      const { old: oldName, new: newName } = suggestion.fix;
      setCode(prev => prev.replace(new RegExp(`\\b${oldName}\\b`, 'g'), newName));
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    }
  };

  // ── Fix All fixable issues ────────────────────────────────────────────────
  const handleFixAll = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API}/lint/autofix`, { code, issues: suggestions });
      setCode(res.data.fixed_code);
      await handleCheck(res.data.fixed_code);
    } catch (err) { console.error('Fix all error:', err); }
    finally { setIsLoading(false); }
  };

  // ── AI Fix for a specific issue ───────────────────────────────────────────
  const handleAIFix = async (suggestion) => {
    try {
      const res = await axios.post(`${API}/lint/ai-fix`, { code, issue: suggestion });
      return res.data; // { explanation, fixed_code, diff_hint }
    } catch (err) {
      console.error('AI Fix error:', err);
      return { explanation: 'AI fix failed. Check your API key.', fixed_code: code };
    }
  };

  const handleApplyAIFix = (fixedCode) => {
    setCode(fixedCode);
    handleCheck(fixedCode);
  };

  return (
    <div className="dashboard-v2">
      <Navbar
        onSave={handleSave}
        onRun={handleRun}
        onCheck={() => handleCheck()}
        onFormat={handleFormat}
        onNewFile={handleNewFile}
        isLoading={isLoading}
        isAnalyzing={isAnalyzing}
        backendStatus={backendStatus}
      />

      <div className="main-content-wrapper">
        <Sidebar
          explorerData={explorerData}
          onFileSelect={handleFileSelect}
          onNewFile={handleNewFile}
          activeFileId={activeFile?.id}
        />

        <main className="editor-area">
          <div className="editor-container-wrapper">
            <div className="editor-container">
              <EditorComponent code={code} onChange={handleCodeChange} markers={markers} />
            </div>

            {showTerminal && output && (
              <div className="terminal-area">
                <div className="term-header">
                  <div className={`term-dot ${output.status}`} />
                  <span>TERMINAL — Python 3.11</span>
                  <button className="term-close" onClick={() => setShowTerminal(false)}>✕</button>
                </div>
                <div className="term-body">
                  {output.status === 'running' && <div className="term-running">⚙ Running…</div>}
                  {output.stdout && <pre className="term-stdout">{output.stdout}</pre>}
                  {output.stderr && <pre className="term-stderr">{output.stderr}</pre>}
                  {output.exit_code !== null && output.exit_code !== undefined && (
                    <div className={`term-exit ${output.exit_code === 0 ? 'ok' : 'fail'}`}>
                      Process exited with code {output.exit_code}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        <SuggestionsPanel
          suggestions={suggestions}
          qualityScore={qualityScore}
          stats={stats}
          isAnalyzing={isAnalyzing}
          onQuickFix={handleQuickFix}
          onFixAll={handleFixAll}
          diffPreview={diffPreview}
          onAIFix={handleAIFix}
          onApplyAIFix={handleApplyAIFix}
        />
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <span className={`sb-item ${backendStatus === 'connected' ? 'ok' : 'err'}`}>
          {backendStatus === 'connected' ? '⬤ Backend Online' : '⬤ Backend Offline'}
        </span>
        {activeFile && <span className="sb-item">{activeFile.name}</span>}
        {stats.errors > 0 && <span className="sb-item err">✕ {stats.errors} error{stats.errors !== 1 ? 's' : ''}</span>}
        {stats.warnings > 0 && <span className="sb-item warn">⚠ {stats.warnings} warning{stats.warnings !== 1 ? 's' : ''}</span>}
        {isAnalyzing && <span className="sb-item muted">Analyzing…</span>}
        <span className="sb-right">Python 3.11 · UTF-8</span>
      </div>
    </div>
  );
};

export default Dashboard;
