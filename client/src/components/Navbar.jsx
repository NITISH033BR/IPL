import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navStyle = {
  background: '#1e293b',
  borderBottom: '1px solid #334155',
  padding: '0 2rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '64px',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const logoStyle = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#3b82f6',
  textDecoration: 'none',
  letterSpacing: '-0.5px',
};

const navLinksStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  listStyle: 'none',
};

const linkStyle = {
  color: '#94a3b8',
  textDecoration: 'none',
  fontSize: '0.95rem',
  fontWeight: 500,
  transition: 'color 0.2s',
};

const activeLinkStyle = {
  ...linkStyle,
  color: '#f1f5f9',
};

const btnStyle = {
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  padding: '0.45rem 1.1rem',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 600,
};

const outlineBtnStyle = {
  background: 'transparent',
  color: '#3b82f6',
  border: '1px solid #3b82f6',
  borderRadius: '6px',
  padding: '0.4rem 1rem',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={navStyle}>
      <Link to="/" style={logoStyle}>🏏 IPL Predict</Link>
      <ul style={navLinksStyle}>
        <li><Link to="/" style={linkStyle}>Home</Link></li>
        <li><Link to="/matches" style={linkStyle}>Matches</Link></li>
        <li><Link to="/leaderboard" style={linkStyle}>Leaderboard</Link></li>
        {user ? (
          <>
            <li><Link to="/predictions" style={linkStyle}>My Predictions</Link></li>
            <li><Link to="/dashboard" style={linkStyle}>Dashboard</Link></li>
            <li>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                Hi, <strong style={{ color: '#f1f5f9' }}>{user.username}</strong>
              </span>
            </li>
            <li>
              <button onClick={handleLogout} style={btnStyle}>Logout</button>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/login" style={outlineBtnStyle}>Login</Link></li>
            <li><Link to="/register" style={{ ...btnStyle, textDecoration: 'none', display: 'inline-block' }}>Register</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}
