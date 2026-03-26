import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock } from 'lucide-react';
import './register.css';

const API_BASE = 'http://127.0.0.1:8000/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, formData);
      localStorage.setItem('token', response.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
      console.error('Register error:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join the community of CleanCodeX</p>
        </div>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <User className="input-icon" size={20} />
            <input 
              type="text" 
              name="name"
              placeholder="Full Name" 
              onChange={handleChange}
              required 
            />
          </div>
          <div className="form-group">
            <Mail className="input-icon" size={20} />
            <input 
              type="email" 
              name="email"
              placeholder="Email Address" 
              onChange={handleChange}
              required 
            />
          </div>
          <div className="form-group">
            <User className="input-icon" size={20} />
            <input 
              type="text" 
              name="username"
              placeholder="Username" 
              onChange={handleChange}
              required 
            />
          </div>
          <div className="form-group">
            <Lock className="input-icon" size={20} />
            <input 
              type="password" 
              name="password"
              placeholder="Password" 
              onChange={handleChange}
              required 
            />
          </div>
          <button type="submit" className="btn-primary w-full">Sign Up</button>
        </form>
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
