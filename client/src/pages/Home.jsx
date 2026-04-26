import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const heroStyle = {
  minHeight: 'calc(100vh - 64px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: '2rem',
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
};

const badgeStyle = {
  display: 'inline-block',
  background: 'rgba(59,130,246,0.15)',
  border: '1px solid rgba(59,130,246,0.3)',
  color: '#60a5fa',
  borderRadius: '999px',
  padding: '0.4rem 1.2rem',
  fontSize: '0.85rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: '1.5rem',
};

const h1Style = {
  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
  fontWeight: 800,
  color: '#f1f5f9',
  lineHeight: 1.1,
  marginBottom: '1rem',
};

const accentStyle = {
  color: '#3b82f6',
};

const subStyle = {
  fontSize: '1.15rem',
  color: '#94a3b8',
  maxWidth: '560px',
  lineHeight: 1.7,
  marginBottom: '2.5rem',
};

const btnGroupStyle = {
  display: 'flex',
  gap: '1rem',
  flexWrap: 'wrap',
  justifyContent: 'center',
};

const primaryBtnStyle = {
  background: '#3b82f6',
  color: '#fff',
  padding: '0.85rem 2rem',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: '1rem',
  transition: 'background 0.2s',
};

const secondaryBtnStyle = {
  background: 'transparent',
  color: '#f1f5f9',
  padding: '0.85rem 2rem',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: '1rem',
  border: '1px solid #334155',
};

const featuresStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1.5rem',
  maxWidth: '900px',
  width: '100%',
  marginTop: '4rem',
};

const featureCardStyle = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '12px',
  padding: '1.5rem',
  textAlign: 'left',
};

export default function Home() {
  const { user } = useAuth();

  return (
    <div style={heroStyle}>
      <span style={badgeStyle}>🏏 IPL 2024 Season</span>
      <h1 style={h1Style}>
        Predict. Compete. <br />
        <span style={accentStyle}>Win the Leaderboard.</span>
      </h1>
      <p style={subStyle}>
        The ultimate IPL cricket prediction platform. Make your match predictions, earn points for correct calls, and climb the global leaderboard.
      </p>
      <div style={btnGroupStyle}>
        <Link to="/matches" style={primaryBtnStyle}>View Matches →</Link>
        {!user && <Link to="/register" style={secondaryBtnStyle}>Join Free</Link>}
        {user && <Link to="/dashboard" style={secondaryBtnStyle}>My Dashboard</Link>}
      </div>

      <div style={featuresStyle}>
        {[
          { icon: '📅', title: 'Live Matches', desc: 'Track real-time scores and match status for all IPL games.' },
          { icon: '🎯', title: 'Make Predictions', desc: 'Predict the winner before each match and earn points for correct calls.' },
          { icon: '🏆', title: 'Leaderboard', desc: 'Compete with other fans and see who has the best prediction accuracy.' },
          { icon: '📊', title: 'Your Stats', desc: 'Track your prediction history, accuracy rate, and total points earned.' },
        ].map((f) => (
          <div key={f.title} style={featureCardStyle}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
            <h3 style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: '0.4rem' }}>{f.title}</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
