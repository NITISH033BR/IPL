import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const containerStyle = {
  maxWidth: '1000px',
  margin: '0 auto',
  padding: '2rem',
};

const headingStyle = {
  fontSize: '2rem',
  fontWeight: 800,
  color: '#f1f5f9',
  marginBottom: '0.5rem',
};

const subStyle = {
  color: '#64748b',
  marginBottom: '2rem',
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '1rem',
  marginBottom: '2rem',
};

const statCardStyle = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '12px',
  padding: '1.5rem',
  textAlign: 'center',
};

const sectionHeadingStyle = {
  fontSize: '1.2rem',
  fontWeight: 700,
  color: '#f1f5f9',
  marginBottom: '1rem',
};

const matchRowStyle = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '10px',
  padding: '1rem 1.25rem',
  marginBottom: '0.75rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading...</div>;
  if (error) return <div style={{ padding: '3rem', textAlign: 'center', color: '#f87171' }}>{error}</div>;

  const { stats, recentPredictions, upcomingMatches, liveMatches } = data;

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>Dashboard</h1>
      <p style={subStyle}>Welcome back, <strong style={{ color: '#60a5fa' }}>{user?.username}</strong>!</p>

      <div style={statsGridStyle}>
        {[
          { label: 'Total Predictions', value: stats.totalPredictions, color: '#60a5fa', icon: '🎯' },
          { label: 'Correct Predictions', value: stats.correctPredictions, color: '#4ade80', icon: '✅' },
          { label: 'Accuracy', value: `${stats.accuracy}%`, color: '#fbbf24', icon: '📊' },
          { label: 'Total Points', value: stats.totalPoints, color: '#f472b6', icon: '⭐' },
        ].map((s) => (
          <div key={s.label} style={statCardStyle}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{s.icon}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {liveMatches.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={sectionHeadingStyle}>🔴 Live Matches</h2>
          {liveMatches.map((m) => (
            <div key={m._id} style={{ ...matchRowStyle, borderColor: '#4ade8033' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{m.team1} vs {m.team2}</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{m.team1Score || '–'} · {m.team2Score || 'Yet to bat'}</div>
              </div>
              <Link to={`/matches/${m._id}`} style={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Predict →
              </Link>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={sectionHeadingStyle}>📅 Upcoming Matches</h2>
        {upcomingMatches.length === 0 && <p style={{ color: '#64748b' }}>No upcoming matches.</p>}
        {upcomingMatches.map((m) => (
          <div key={m._id} style={matchRowStyle}>
            <div>
              <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{m.team1} vs {m.team2}</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                {m.venue} · {new Date(m.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </div>
            </div>
            <Link to={`/matches/${m._id}`} style={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Predict →
            </Link>
          </div>
        ))}
      </div>

      <div>
        <h2 style={sectionHeadingStyle}>🕐 Recent Predictions</h2>
        {recentPredictions.length === 0 && (
          <p style={{ color: '#64748b' }}>
            No predictions yet.{' '}
            <Link to="/matches" style={{ color: '#3b82f6' }}>Make your first one!</Link>
          </p>
        )}
        {recentPredictions.map((pred) => (
          <div key={pred._id} style={matchRowStyle}>
            <div>
              <div style={{ fontWeight: 700, color: '#f1f5f9' }}>
                {pred.match?.team1} vs {pred.match?.team2}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                Picked: <span style={{ color: '#60a5fa' }}>{pred.predictedWinner}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                color: pred.isCorrect === true ? '#4ade80' : pred.isCorrect === false ? '#f87171' : '#64748b',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}>
                {pred.isCorrect === true ? '✅ Correct' : pred.isCorrect === false ? '❌ Wrong' : '⏳ Pending'}
              </div>
              <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.95rem' }}>{pred.points} pts</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
