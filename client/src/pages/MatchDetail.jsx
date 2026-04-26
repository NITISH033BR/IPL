import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const containerStyle = {
  maxWidth: '800px',
  margin: '0 auto',
  padding: '2rem',
};

const cardStyle = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '16px',
  padding: '2rem',
  marginBottom: '2rem',
};

const statusColors = {
  live: { background: '#dcfce7', color: '#166534' },
  upcoming: { background: '#fef9c3', color: '#854d0e' },
  completed: { background: '#f1f5f9', color: '#475569' },
};

const labelStyle = {
  color: '#64748b',
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.25rem',
};

const inputStyle = {
  width: '100%',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '6px',
  padding: '0.7rem 1rem',
  color: '#f1f5f9',
  fontSize: '0.95rem',
  outline: 'none',
};

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
};

const btnStyle = {
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '0.85rem 2rem',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: 700,
  width: '100%',
  marginTop: '0.5rem',
};

export default function MatchDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [predictedWinner, setPredictedWinner] = useState('');
  const [predictedTeam1Score, setPredictedTeam1Score] = useState('');
  const [predictedTeam2Score, setPredictedTeam2Score] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    api.get(`/matches/${id}`)
      .then((res) => {
        setMatch(res.data);
        setPredictedWinner(res.data.team1);
      })
      .catch(() => setError('Match not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setSubmitting(true);
    setSubmitError('');
    setSubmitMsg('');
    try {
      await api.post('/predictions', {
        matchId: id,
        predictedWinner,
        predictedTeam1Score,
        predictedTeam2Score,
      });
      setSubmitMsg('✅ Prediction submitted successfully!');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit prediction.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading...</div>;
  if (error) return <div style={{ padding: '3rem', textAlign: 'center', color: '#f87171' }}>{error}</div>;
  if (!match) return null;

  const statusBadge = statusColors[match.status] || statusColors.completed;
  const canPredict = user && (match.status === 'upcoming' || match.status === 'live');
  const matchDate = new Date(match.date).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });

  return (
    <div style={containerStyle}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        ← Back
      </button>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ ...statusBadge, borderRadius: '999px', padding: '0.3rem 1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
            {match.status === 'live' ? '🔴 LIVE' : match.status}
          </span>
          {match.winner && (
            <span style={{ color: '#4ade80', fontWeight: 700 }}>🏆 Winner: {match.winner}</span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' }}>{match.team1}</div>
            {match.team1Score && <div style={{ color: '#4ade80', fontWeight: 600, marginTop: '0.5rem' }}>{match.team1Score}</div>}
          </div>
          <div style={{ color: '#64748b', fontWeight: 700, fontSize: '1.1rem' }}>VS</div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' }}>{match.team2}</div>
            {match.team2Score && <div style={{ color: '#4ade80', fontWeight: 600, marginTop: '0.5rem' }}>{match.team2Score}</div>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#0f172a', borderRadius: '8px', padding: '1rem' }}>
            <div style={labelStyle}>Venue</div>
            <div style={{ color: '#f1f5f9', fontWeight: 500 }}>{match.venue}</div>
          </div>
          <div style={{ background: '#0f172a', borderRadius: '8px', padding: '1rem' }}>
            <div style={labelStyle}>Date & Time</div>
            <div style={{ color: '#f1f5f9', fontWeight: 500 }}>{matchDate}</div>
          </div>
        </div>

        <div style={{ background: '#0f172a', borderRadius: '8px', padding: '1rem' }}>
          <div style={labelStyle}>Odds</div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem' }}>{match.odds?.team1Win?.toFixed(2)}</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{match.team1}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem' }}>{match.odds?.draw?.toFixed(2)}</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Draw</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem' }}>{match.odds?.team2Win?.toFixed(2)}</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{match.team2}</div>
            </div>
          </div>
        </div>
      </div>

      {canPredict && (
        <div style={cardStyle}>
          <h2 style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.3rem' }}>Make Your Prediction</h2>
          <form onSubmit={handlePredict} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={labelStyle}>Predicted Winner *</div>
              <select style={selectStyle} value={predictedWinner} onChange={(e) => setPredictedWinner(e.target.value)} required>
                <option value={match.team1}>{match.team1}</option>
                <option value={match.team2}>{match.team2}</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={labelStyle}>{match.team1} Score (optional)</div>
                <input style={inputStyle} type="text" placeholder="e.g. 180/4 (20)" value={predictedTeam1Score} onChange={(e) => setPredictedTeam1Score(e.target.value)} />
              </div>
              <div>
                <div style={labelStyle}>{match.team2} Score (optional)</div>
                <input style={inputStyle} type="text" placeholder="e.g. 175/6 (20)" value={predictedTeam2Score} onChange={(e) => setPredictedTeam2Score(e.target.value)} />
              </div>
            </div>
            {submitMsg && <div style={{ color: '#4ade80', fontWeight: 600, textAlign: 'center' }}>{submitMsg}</div>}
            {submitError && <div style={{ color: '#f87171', fontWeight: 600, textAlign: 'center' }}>{submitError}</div>}
            <button type="submit" style={btnStyle} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Prediction'}
            </button>
          </form>
        </div>
      )}

      {!user && match.status !== 'completed' && (
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Log in to make a prediction for this match.</p>
          <a href="/login" style={{ color: '#3b82f6', fontWeight: 600 }}>Login →</a>
        </div>
      )}
    </div>
  );
}
