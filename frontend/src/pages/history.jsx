import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import ArrowLeftIcon from '@mui/icons-material/ArrowBack';
import VideocamIcon from '@mui/icons-material/Videocam';

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getHistoryOfUser()
      .then(h => setMeetings([...h].sort((a, b) => new Date(b.date) - new Date(a.date))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (d) => {
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="historyPageContainer" style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/home')}>
          <ArrowLeftIcon style={{ fontSize: '1rem' }} />
          Back
        </button>
        <span style={s.title}>Meeting history</span>
        <span style={s.badge}>{meetings.length}</span>
      </div>

      {/* Content */}
      <div style={s.content}>
        {loading ? (
          <div style={s.center}><p style={s.dim}>Loading…</p></div>
        ) : meetings.length === 0 ? (
          <div style={s.center}>
            <VideocamIcon style={{ fontSize: '2rem', color: '#333339', marginBottom: '0.8rem' }} />
            <p style={{ color: '#9090a0', fontSize: '0.9rem', marginBottom: '0.3rem' }}>No meetings yet</p>
            <p style={s.dim}>Your past meetings will appear here.</p>
            <button style={s.startBtn} onClick={() => navigate('/home')}>Start a meeting</button>
          </div>
        ) : (
          <div style={s.list}>
            {meetings.map((e, i) => (
              <div key={i} style={s.row}>
                <div style={s.icon}>
                  <VideocamIcon style={{ fontSize: '1rem', color: '#FF8C00' }} />
                </div>
                <div style={s.info}>
                  <p style={s.code}>{e.meetingCode}</p>
                  <p style={s.meta}>{formatDate(e.date)} · {formatTime(e.date)}</p>
                </div>
                <button style={s.rejoin} onClick={() => navigate(`/${e.meetingCode}`)}>
                  Rejoin
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  header: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    padding: '0 2.5rem', height: '60px',
    borderBottom: '1px solid #2a2a30',
    background: '#000000',
    position: 'sticky', top: 0, zIndex: 100,
  },
  back: {
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    padding: '0.4rem 0.9rem',
    background: 'transparent', border: '1px solid #2a2a30',
    borderRadius: '8px', color: '#9090a0',
    fontSize: '0.82rem', fontWeight: '500',
    cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  title: { flex: 1, fontSize: '0.95rem', fontWeight: '600', color: '#f0f0f4' },
  badge: {
    fontSize: '0.75rem', color: '#9090a0',
    background: '#1c1c21', border: '1px solid #2a2a30',
    borderRadius: '999px', padding: '0.2rem 0.65rem',
  },
  content: { padding: '2rem 2.5rem', maxWidth: '700px', margin: '0 auto' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  row: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    padding: '1rem 1.2rem',
    background: '#141417', border: '1px solid #2a2a30',
    borderRadius: '10px', transition: 'border-color 0.15s',
  },
  icon: {
    width: '36px', height: '36px', borderRadius: '8px',
    background: 'rgba(255,140,0,0.08)', border: '1px solid rgba(255,140,0,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  info: { flex: 1 },
  code: { fontSize: '0.9rem', fontWeight: '600', color: '#f0f0f4', fontFamily: 'monospace', letterSpacing: '0.04em', margin: 0 },
  meta: { fontSize: '0.78rem', color: '#9090a0', marginTop: '0.2rem', margin: 0 },
  rejoin: {
    padding: '0.4rem 0.9rem',
    background: 'transparent', border: '1px solid #2a2a30',
    borderRadius: '7px', color: '#9090a0',
    fontSize: '0.8rem', fontWeight: '500',
    cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
    whiteSpace: 'nowrap', transition: 'all 0.15s',
  },
  center: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    minHeight: '50vh', gap: '0.4rem', textAlign: 'center',
  },
  dim: { fontSize: '0.82rem', color: '#55555f', margin: 0 },
  startBtn: {
    marginTop: '1rem', padding: '0.6rem 1.4rem',
    background: 'linear-gradient(135deg, #FFEB3B 0%, #FF5722 100%)', border: 'none',
    borderRadius: '8px', color: '#1a1a1d',
    fontSize: '0.85rem', fontWeight: '600',
    cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
};