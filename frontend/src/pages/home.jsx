import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { AuthContext } from '../contexts/AuthContext';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';

function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState('');
  const { addToUserHistory } = useContext(AuthContext);

  const handleJoin = async () => {
    if (!meetingCode.trim()) return;
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  const generateCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const code = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setMeetingCode(code);
  };

  return (
    <div className='homePageContainer'>
      {/* Nav */}
      <div className="navBar">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <img 
              src="/callifyLogo.png" 
              alt="Callify" 
              style={{ width: '28px', height: '28px', objectFit: 'contain', mixBlendMode: 'screen' }} 
          />
          Callify
      </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button style={nb} onClick={() => navigate('/profile')}>
            <PersonIcon style={{ fontSize: '1rem' }} />
            Profile
          </button>
          <button style={nb} onClick={() => navigate('/history')}>
            <HistoryIcon style={{ fontSize: '1rem' }} />
            History
          </button>
          <button
            style={{ ...nb, color: '#f75555', borderColor: 'rgba(247,85,85,0.2)' }}
            onClick={() => { localStorage.removeItem('token'); navigate('/'); }}
          >
            <LogoutIcon style={{ fontSize: '1rem' }} />
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="meetContainer">
        <div className="leftPanel">
          <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#ff8c00', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.9rem' }}>
            Video conferencing
          </p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1.2', marginBottom: '1rem' }}>
            Start or join<br />a meeting
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#9090a0', lineHeight: '1.7', marginBottom: '2rem', maxWidth: '360px' }}>
            Enter a meeting code to join, or generate one to invite others.
          </p>

          {/* Join box */}
          <div style={{ background: '#141417', border: '1px solid #2a2a30', borderRadius: '14px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#9090a0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Meeting code
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                style={inputStyle}
                placeholder="e.g. abc123xyz"
                value={meetingCode}
                onChange={e => setMeetingCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
              <button style={joinBtnStyle} onClick={handleJoin}>
                Join
              </button>
            </div>
            <button style={genBtnStyle} onClick={generateCode}>
              + Generate new code
            </button>
          </div>
        </div>

        <div className="rightPanel">
          {/* Simple decorative SVG instead of image */}
          <svg width="320" height="280" viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="30" width="280" height="180" rx="12" fill="#141417" stroke="#2a2a30" strokeWidth="1.5"/>
            <rect x="20" y="30" width="280" height="32" rx="12" fill="#1c1c21"/>
            <rect x="20" y="50" width="280" height="12" fill="#1c1c21"/>
            <circle cx="40" cy="46" r="4" fill="#f75555" opacity="0.6"/>
            <circle cx="54" cy="46" r="4" fill="#f7c355" opacity="0.6"/>
            <circle cx="68" cy="46" r="4" fill="#4fcf8e" opacity="0.6"/>
            <rect x="36" y="78" width="156" height="114" rx="8" fill="#1c1c21" stroke="#2a2a30" strokeWidth="1"/>
            <circle cx="114" cy="127" r="22" fill="#2a2a30"/>
            <circle cx="114" cy="120" r="9" fill="#333339"/>
            <path d="M94 143 Q114 134 134 143" stroke="#333339" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <rect x="36" y="198" width="156" height="4" rx="2" fill="#1c1c21"/>
            <rect x="36" y="198" width="60" height="4" rx="2" fill="#FF8C00" opacity="0.7"/>
            <rect x="202" y="78" width="82" height="52" rx="8" fill="#1c1c21" stroke="#2a2a30" strokeWidth="1"/>
            <circle cx="243" cy="101" r="11" fill="#2a2a30"/>
            <rect x="202" y="140" width="82" height="52" rx="8" fill="#1c1c21" stroke="#FF8C00" strokeWidth="1" opacity="0.5"/>
            <circle cx="243" cy="163" r="11" fill="#2a2a30"/>
            <rect x="36" y="208" width="248" height="2" rx="1" fill="#2a2a30"/>
            <rect x="56" y="218" width="24" height="18" rx="6" fill="#1c1c21" stroke="#2a2a30" strokeWidth="1"/>
            <rect x="88" y="218" width="24" height="18" rx="6" fill="#1c1c21" stroke="#2a2a30" strokeWidth="1"/>
            <rect x="128" y="216" width="36" height="22" rx="7" fill="#f75555" opacity="0.85"/>
            <rect x="176" y="218" width="24" height="18" rx="6" fill="#1c1c21" stroke="#2a2a30" strokeWidth="1"/>
            <rect x="208" y="218" width="24" height="18" rx="6" fill="#FF8C00" opacity="0.15" stroke="#FF8C00" strokeWidth="1" opacity="0.4"/>
            {/* Floating badge */}
            <rect x="220" y="10" width="90" height="26" rx="7" fill="#141417" stroke="#2a2a30" strokeWidth="1"/>
            <circle cx="234" cy="23" r="4" fill="#4fcf8e"/>
            <rect x="244" y="19" width="36" height="4" rx="2" fill="#2a2a30"/>
            <rect x="244" y="26" width="24" height="3" rx="1.5" fill="#2a2a30"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

const nb = {
  display: 'flex', alignItems: 'center', gap: '0.35rem',
  padding: '0.4rem 0.9rem',
  background: 'transparent',
  border: '1px solid #2a2a30',
  borderRadius: '8px',
  color: '#9090a0',
  fontSize: '0.82rem', fontWeight: '500',
  cursor: 'pointer',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  transition: 'color 0.15s, border-color 0.15s',
};

const inputStyle = {
  flex: 1, padding: '0.65rem 0.9rem',
  background: '#1c1c21', border: '1px solid #2a2a30',
  borderRadius: '8px', color: '#f0f0f4',
  fontSize: '0.88rem', outline: 'none',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  letterSpacing: '0.02em',
};

const joinBtnStyle = {
  padding: '0.65rem 1.2rem',
  background: 'linear-gradient(135deg, #FFEB3B 0%, #FF5722 100%)', border: 'none',
  borderRadius: '8px', color: '#fff',
  fontSize: '0.88rem', fontWeight: '600',
  cursor: 'pointer',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  whiteSpace: 'nowrap',
  transition: 'opacity 0.15s',
};

const genBtnStyle = {
  padding: '0.55rem 0.9rem',
  background: 'transparent', border: '1px solid #2a2a30',
  borderRadius: '7px', color: '#9090a0',
  fontSize: '0.8rem', cursor: 'pointer',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  transition: 'color 0.15s, border-color 0.15s',
  alignSelf: 'flex-start',
};

export default withAuth(HomeComponent);