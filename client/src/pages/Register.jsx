import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const pageStyle = {
  minHeight: 'calc(100vh - 64px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
};

const cardStyle = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '16px',
  padding: '2.5rem',
  width: '100%',
  maxWidth: '420px',
};

const headingStyle = {
  fontSize: '1.75rem',
  fontWeight: 800,
  color: '#f1f5f9',
  marginBottom: '0.5rem',
};

const subStyle = {
  color: '#64748b',
  marginBottom: '2rem',
  fontSize: '0.9rem',
};

const labelStyle = {
  display: 'block',
  color: '#94a3b8',
  fontSize: '0.85rem',
  fontWeight: 500,
  marginBottom: '0.4rem',
};

const inputStyle = {
  width: '100%',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '6px',
  padding: '0.75rem 1rem',
  color: '#f1f5f9',
  fontSize: '0.95rem',
  outline: 'none',
  marginBottom: '1rem',
};

const btnStyle = {
  width: '100%',
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '0.85rem',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer',
  marginTop: '0.5rem',
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg
        || err.response?.data?.message
        || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={headingStyle}>Create an account 🏏</h1>
        <p style={subStyle}>Join thousands of IPL fans making predictions.</p>

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#f87171', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={labelStyle} htmlFor="username">Username</label>
          <input
            id="username"
            style={inputStyle}
            type="text"
            placeholder="coolcricketer99"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <label style={labelStyle} htmlFor="email">Email</label>
          <input
            id="email"
            style={inputStyle}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <label style={labelStyle} htmlFor="password">Password</label>
          <input
            id="password"
            style={inputStyle}
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <button type="submit" style={btnStyle} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#3b82f6', fontWeight: 600 }}>Log In</Link>
        </p>
      </div>
    </div>
  );
}
