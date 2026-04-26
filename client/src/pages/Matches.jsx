import { useState, useEffect } from 'react';
import api from '../services/api';
import MatchCard from '../components/MatchCard';

const containerStyle = {
  maxWidth: '1100px',
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

const tabsStyle = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '2rem',
  flexWrap: 'wrap',
};

const tabStyle = (active) => ({
  padding: '0.5rem 1.25rem',
  borderRadius: '999px',
  border: active ? 'none' : '1px solid #334155',
  background: active ? '#3b82f6' : 'transparent',
  color: active ? '#fff' : '#94a3b8',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9rem',
  transition: 'all 0.2s',
});

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: '1.5rem',
};

const FILTERS = ['all', 'upcoming', 'live', 'completed'];

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = filter !== 'all' ? `?status=${filter}` : '';
    api.get(`/matches${params}`)
      .then((res) => setMatches(res.data))
      .catch(() => setError('Failed to load matches.'))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>Matches</h1>
      <p style={subStyle}>Browse all IPL matches and make your predictions.</p>

      <div style={tabsStyle}>
        {FILTERS.map((f) => (
          <button key={f} style={tabStyle(filter === f)} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: '#64748b', textAlign: 'center', padding: '3rem' }}>Loading matches...</div>}
      {error && <div style={{ color: '#f87171', textAlign: 'center', padding: '3rem' }}>{error}</div>}
      {!loading && !error && matches.length === 0 && (
        <div style={{ color: '#64748b', textAlign: 'center', padding: '3rem' }}>No matches found.</div>
      )}

      <div style={gridStyle}>
        {matches.map((match) => (
          <MatchCard key={match._id} match={match} />
        ))}
      </div>
    </div>
  );
}
