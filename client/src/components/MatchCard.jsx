import { Link } from 'react-router-dom';

const cardStyle = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '12px',
  padding: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  transition: 'border-color 0.2s',
};

const statusColors = {
  live: { background: '#dcfce7', color: '#166534' },
  upcoming: { background: '#fef9c3', color: '#854d0e' },
  completed: { background: '#f1f5f9', color: '#475569' },
};

const teamsRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.5rem',
};

const teamStyle = {
  fontSize: '1.05rem',
  fontWeight: 700,
  color: '#f1f5f9',
  flex: 1,
  textAlign: 'center',
};

const vsStyle = {
  color: '#64748b',
  fontSize: '0.85rem',
  fontWeight: 600,
  padding: '0 0.5rem',
};

const scoreStyle = {
  textAlign: 'center',
  fontSize: '0.8rem',
  color: '#94a3b8',
};

const metaStyle = {
  fontSize: '0.8rem',
  color: '#64748b',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
};

const oddsRowStyle = {
  display: 'flex',
  gap: '0.5rem',
  fontSize: '0.75rem',
};

const oddsBadgeStyle = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '4px',
  padding: '0.2rem 0.5rem',
  color: '#94a3b8',
  flex: 1,
  textAlign: 'center',
};

const viewBtnStyle = {
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  padding: '0.6rem 1rem',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 600,
  textDecoration: 'none',
  textAlign: 'center',
  display: 'block',
  marginTop: '0.25rem',
};

export default function MatchCard({ match }) {
  const statusBadge = statusColors[match.status] || statusColors.completed;
  const matchDate = new Date(match.date).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...statusBadge, borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {match.status === 'live' ? '🔴 LIVE' : match.status}
        </span>
        {match.winner && (
          <span style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 600 }}>
            🏆 {match.winner}
          </span>
        )}
      </div>

      <div style={teamsRowStyle}>
        <div style={teamStyle}>{match.team1}</div>
        <div style={vsStyle}>VS</div>
        <div style={teamStyle}>{match.team2}</div>
      </div>

      {(match.team1Score || match.team2Score) && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={scoreStyle}>{match.team1Score || '–'}</span>
          <span style={scoreStyle}>{match.team2Score || '–'}</span>
        </div>
      )}

      <div style={metaStyle}>
        <span>📍 {match.venue}</span>
        <span>📅 {matchDate}</span>
      </div>

      <div style={oddsRowStyle}>
        <div style={oddsBadgeStyle}>
          <div style={{ color: '#f1f5f9', fontWeight: 600 }}>{match.odds?.team1Win?.toFixed(2)}</div>
          <div style={{ fontSize: '0.7rem' }}>Team 1</div>
        </div>
        <div style={oddsBadgeStyle}>
          <div style={{ color: '#f1f5f9', fontWeight: 600 }}>{match.odds?.draw?.toFixed(2)}</div>
          <div style={{ fontSize: '0.7rem' }}>Draw</div>
        </div>
        <div style={oddsBadgeStyle}>
          <div style={{ color: '#f1f5f9', fontWeight: 600 }}>{match.odds?.team2Win?.toFixed(2)}</div>
          <div style={{ fontSize: '0.7rem' }}>Team 2</div>
        </div>
      </div>

      <Link to={`/matches/${match._id}`} style={viewBtnStyle}>
        View Details →
      </Link>
    </div>
  );
}
