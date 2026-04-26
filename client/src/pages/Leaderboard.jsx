import { useState, useEffect } from 'react';
import api from '../services/api';

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

const tableContainerStyle = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '16px',
  overflow: 'hidden',
};

const thStyle = {
  padding: '1rem 1.25rem',
  textAlign: 'left',
  color: '#64748b',
  fontWeight: 600,
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  background: '#0f172a',
};

const tdStyle = {
  padding: '1rem 1.25rem',
  borderTop: '1px solid #334155',
  color: '#f1f5f9',
  fontSize: '0.95rem',
};

const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/leaderboard')
      .then((res) => setLeaderboard(res.data))
      .catch(() => setError('Failed to load leaderboard.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>🏆 Leaderboard</h1>
      <p style={subStyle}>Top predictors ranked by points and accuracy.</p>

      {loading && <div style={{ color: '#64748b', textAlign: 'center', padding: '3rem' }}>Loading...</div>}
      {error && <div style={{ color: '#f87171', textAlign: 'center', padding: '3rem' }}>{error}</div>}

      {!loading && !error && leaderboard.length === 0 && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
          <p style={{ color: '#64748b' }}>No predictions yet. Be the first to make a prediction!</p>
        </div>
      )}

      {leaderboard.length > 0 && (
        <div style={tableContainerStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Rank</th>
                <th style={thStyle}>Player</th>
                <th style={thStyle}>Total Predictions</th>
                <th style={thStyle}>Correct</th>
                <th style={thStyle}>Accuracy</th>
                <th style={thStyle}>Points</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => (
                <tr key={entry._id} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={tdStyle}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: idx < 3 ? '1.2rem' : '1rem',
                      color: rankColors[idx] || '#94a3b8',
                    }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700 }}>{entry.username}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{entry.email}</div>
                  </td>
                  <td style={tdStyle}>{entry.totalPredictions}</td>
                  <td style={tdStyle}>
                    <span style={{ color: '#4ade80' }}>{entry.correctPredictions}</span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        height: '6px',
                        width: '80px',
                        background: '#0f172a',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${entry.accuracy}%`,
                          background: entry.accuracy >= 60 ? '#4ade80' : entry.accuracy >= 40 ? '#fbbf24' : '#f87171',
                          borderRadius: '999px',
                        }} />
                      </div>
                      <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{entry.accuracy}%</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '1.1rem' }}>{entry.totalPoints}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
