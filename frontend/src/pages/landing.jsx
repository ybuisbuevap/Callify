import React, { useState } from 'react'
import "../App.css"
import { Link, useNavigate } from 'react-router-dom'

const HeroSVG = () => (
  <svg width="420" height="340" viewBox="0 0 420 340" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="40" y="40" width="340" height="220" rx="14" fill="#141417" stroke="#2a2a30" strokeWidth="1.5"/>
    <rect x="40" y="40" width="340" height="38" rx="14" fill="#1c1c21"/>
    <rect x="40" y="64" width="340" height="14" fill="#1c1c21"/>
    <circle cx="64" cy="59" r="5" fill="#f75555" opacity="0.7"/>
    <circle cx="82" cy="59" r="5" fill="#f7c355" opacity="0.7"/>
    <circle cx="100" cy="59" r="5" fill="#4fcf8e" opacity="0.7"/>
    <rect x="56" y="94" width="210" height="148" rx="8" fill="#1c1c21" stroke="#2a2a30" strokeWidth="1"/>
    <circle cx="161" cy="155" r="28" fill="#2a2a30"/>
    <circle cx="161" cy="145" r="12" fill="#3a3a42"/>
    <path d="M135 178 Q161 166 187 178" stroke="#3a3a42" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <rect x="56" y="228" width="210" height="4" rx="2" fill="#1c1c21"/>
    {/* Changed from blue to orange gradient */}
    <rect x="56" y="228" width="80" height="4" rx="2" fill="url(#orangeGradient)" opacity="0.8"/>
    <rect x="278" y="94" width="86" height="66" rx="8" fill="#1c1c21" stroke="#2a2a30" strokeWidth="1"/>
    <circle cx="321" cy="120" r="14" fill="#2a2a30"/>
    <circle cx="321" cy="115" r="6" fill="#3a3a42"/>
    <rect x="278" y="170" width="86" height="66" rx="8" fill="#1c1c21" stroke="#2a2a30" strokeWidth="1"/>
    <circle cx="321" cy="196" r="14" fill="#2a2a30"/>
    <circle cx="321" cy="191" r="6" fill="#3a3a42"/>
    {/* Changed border from blue to orange */}
    <rect x="278" y="170" width="86" height="66" rx="8" fill="none" stroke="#FF8C00" strokeWidth="1.5" opacity="0.5"/>
    <rect x="56" y="242" width="308" height="44" rx="8" fill="#1c1c21"/>
    <rect x="78" y="253" width="28" height="22" rx="6" fill="#2a2a30"/>
    <rect x="86" y="258" width="12" height="8" rx="3" fill="#9090a0"/>
    <path d="M83 266 Q92 272 101 266" stroke="#9090a0" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <rect x="116" y="253" width="28" height="22" rx="6" fill="#2a2a30"/>
    <rect x="122" y="258" width="10" height="10" rx="2" fill="#9090a0"/>
    <path d="M132 261 L137 258 L137 268 L132 265" fill="#9090a0"/>
    <rect x="154" y="251" width="44" height="26" rx="8" fill="#f75555" opacity="0.9"/>
    <path d="M163 264 Q176 258 189 264" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <rect x="208" y="253" width="28" height="22" rx="6" fill="#2a2a30"/>
    <rect x="213" y="257" width="18" height="12" rx="2" fill="none" stroke="#9090a0" strokeWidth="1.2"/>
    <path d="M222 269 L222 273" stroke="#9090a0" strokeWidth="1.2" strokeLinecap="round"/>
    {/* Changed from blue to orange */}
    <rect x="246" y="253" width="28" height="22" rx="6" fill="#FF8C00" opacity="0.15"/>
    <rect x="251" y="257" width="18" height="13" rx="3" fill="none" stroke="#FF8C00" strokeWidth="1.2"/>
    <path d="M251 270 L256 275 L256 270" fill="#FF8C00" opacity="0.6"/>
    <rect x="270" y="20" width="110" height="28" rx="8" fill="#111114" stroke="#2a2a30" strokeWidth="1"/>
    <circle cx="286" cy="34" r="4" fill="#4fcf8e"/>
    <rect x="296" y="29" width="50" height="5" rx="2.5" fill="#2a2a30"/>
    <rect x="296" y="37" width="36" height="4" rx="2" fill="#2a2a30"/>
    <rect x="20" y="200" width="130" height="52" rx="10" fill="#1c1c21" stroke="#2a2a30" strokeWidth="1"/>
    {/* Changed from blue to orange */}
    <rect x="32" y="212" width="60" height="4" rx="2" fill="#FF8C00" opacity="0.6"/>
    <rect x="32" y="221" width="96" height="4" rx="2" fill="#2a2a30"/>
    <rect x="32" y="230" width="76" height="4" rx="2" fill="#2a2a30"/>
    <path d="M36 252 L28 262 L50 252" fill="#111114" stroke="#2a2a30" strokeWidth="1"/>
    {[0,1,2,3,4,5].map(row =>
      [0,1,2,3,4,5,6].map(col => (
        <circle key={`${row}-${col}`} cx={col * 60 + 30} cy={row * 60 + 10} r="1" fill="#2a2a30" opacity="0.5"/>
      ))
    )}
    {/* Add gradient definition */}
    <defs>
      <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFEB3B" />
        <stop offset="100%" stopColor="#FF5722" />
      </linearGradient>
    </defs>
  </svg>
)

export default function LandingPage() {
  const router = useNavigate();
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [meetingCode, setMeetingCode] = useState('');
  const [error, setError] = useState('');

  const handleGuestJoin = () => {
    if (!guestName.trim()) { setError('Please enter your name.'); return; }
    if (!meetingCode.trim()) { setError('Please enter a meeting code.'); return; }
    router(`/${meetingCode.trim()}?guest=${encodeURIComponent(guestName.trim())}`);
  };

  return (
    <div className='landingPageContainer'>
      <nav>
        <div className='navHeader'>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <img 
                src="/callifyLogo.png" 
                alt="Callify" 
                style={{ width: '36px', height: '36px', objectFit: 'contain', mixBlendMode: 'screen' }} 
            />
            Callify
        </h2>
        </div>
        <div className='navlist'>
          <p onClick={() => setShowGuestModal(true)}>Join as Guest</p>
          <p onClick={() => router("/auth")}>Register</p>
          <div onClick={() => router("/auth")} role='button'>
            <p>Login</p>
          </div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1>
            Video calls that<br />
            <span>just work.</span>
          </h1>
          <p>
            Simple, fast, and reliable video conferencing.
            Start or join a meeting in seconds — no downloads required.
          </p>
          <div role='button'>
            <Link to={"/auth"}>Get started →</Link>
          </div>
        </div>
        <div>
          <HeroSVG />
        </div>
      </div>

      {/* Guest join modal */}
      {showGuestModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <p style={s.title}>Join as Guest</p>
            <p style={s.sub}>Enter a meeting code and your name to join.</p>

            <div style={s.field}>
              <label style={s.label}>Meeting code</label>
              <input
                style={s.input} type="text" placeholder="e.g. abc123xyz"
                value={meetingCode} onChange={e => { setMeetingCode(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleGuestJoin()}
                autoFocus
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Your name</label>
              <input
                style={s.input} type="text" placeholder="John Doe"
                value={guestName} onChange={e => { setGuestName(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleGuestJoin()}
              />
            </div>

            {error && <p style={s.error}>{error}</p>}

            <div style={s.btns}>
              <button style={s.cancelBtn} onClick={() => { setShowGuestModal(false); setError(''); }}>
                Cancel
              </button>
              <button style={s.joinBtn} onClick={handleGuestJoin}>
                Join Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, padding: '1.5rem',
  },
  modal: {
    width: '100%', maxWidth: '360px', background: '#141417',
    border: '1px solid #2a2a30', borderRadius: '16px',
    padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem',
  },
  title: { fontSize: '1.1rem', fontWeight: '700', color: '#f0f0f4', margin: 0 },
  sub: { fontSize: '0.82rem', color: '#9090a0', margin: 0 },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.78rem', fontWeight: '500', color: '#9090a0' },
  input: {
    padding: '0.65rem 0.9rem', background: '#1c1c21', border: '1px solid #2a2a30',
    borderRadius: '8px', color: '#f0f0f4', fontSize: '0.9rem', outline: 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  error: {
    fontSize: '0.82rem', color: '#f75555', background: 'rgba(247,85,85,0.08)',
    border: '1px solid rgba(247,85,85,0.2)', borderRadius: '7px',
    padding: '0.6rem 0.9rem', margin: 0,
  },
  btns: { display: 'flex', gap: '0.6rem' },
  cancelBtn: {
    flex: 1, padding: '0.65rem', background: 'transparent',
    border: '1px solid #2a2a30', borderRadius: '8px',
    color: '#9090a0', fontSize: '0.88rem', cursor: 'pointer',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  joinBtn: {
    flex: 1, padding: '0.65rem', 
    // Changed from solid blue to gradient
    background: 'linear-gradient(135deg, #FFEB3B 0%, #FF5722 100%)',
    border: 'none', borderRadius: '8px', color: '#fff',
    fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
};