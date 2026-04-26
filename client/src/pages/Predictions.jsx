import { useState, useEffect } from 'react';
import api from '../services/api';

const containerStyle = {
  maxWidth: '900px',
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

const cardStyle = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '12px',
  padding: '1.5rem',
  marginBottom: '1rem',
};

const statusColors = {
  upcoming: '#fbbf24',
  live: '#4ade80',
  completed: '#64748b',
};

const resultColors = {
  true: '#4ade80',
  false: '#f87171',
  null: '#64748b',
};

export default function Predictions() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/predictions/my')
      .then((res) => setPredictions(res.data))
      .catch(() => setError('Failed to load predictions.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>My Predictions</h1>
      <p style={subStyle}>Track all your match predictions and results.</p>

      {loading && <div style={{ color: '#64748b', textAlign: 'center', padding: '3rem' }}>Loading...</div>}
      {error && <div style={{ color: '#f87171', textAlign: 'center', padding: '3rem' }}>{error}</div>}

      {!loading && !error && predictions.length === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>No predictions yet. Go pick your winners!</p>
          <a href="/matches" style={{ color: '#3b82f6', fontWeight: 600 }}>Browse Matches →</a>
        </div>
      )}

      {predictions.map((pred) => (
        <div key={pred._id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f1f5f9' }}>
                {pred.match?.team1} <span style={{ color: '#64748b' }}>vs</span> {pred.match?.team2}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                {pred.match?.venue} · {pred.match?.date ? new Date(pred.match.date).toLocaleDateString('en-IN') : ''}
              </div>
            </div>
            <span style={{
              background: statusColors[pred.match?.status] + '22',
              color: statusColors[pred.match?.status],
              borderRadius: '999px',
              padding: '0.2rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}>
              {pred.match?.status}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            <div style={{ background: '#0f172a', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.2rem' }}>YOUR PICK</div>
              <div style={{ color: '#60a5fa', fontWeight: 600 }}>{pred.predictedWinner}</div>
            </div>
            {pred.match?.winner && (
              <div style={{ background: '#0f172a', borderRadius: '8px', padding: '0.75rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.2rem' }}>ACTUAL WINNER</div>
                <div style={{ color: '#f1f5f9', fontWeight: 600 }}>{pred.match.winner}</div>
              </div>
            )}
            {pred.predictedTeam1Score && (
              <div style={{ background: '#0f172a', borderRadius: '8px', padding: '0.75rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.2rem' }}>PREDICTED SCORES</div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  {pred.predictedTeam1Score} / {pred.predictedTeam2Score}
                </div>
              </div>
            )}
            <div style={{ background: '#0f172a', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.2rem' }}>RESULT</div>
              <div style={{ color: resultColors[String(pred.isCorrect)], fontWeight: 700 }}>
                {pred.isCorrect === true ? '✅ Correct' : pred.isCorrect === false ? '❌ Wrong' : '⏳ Pending'}
              </div>
            </div>
            <div style={{ background: '#0f172a', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.2rem' }}>POINTS</div>
              <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '1.1rem' }}>{pred.points}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
