import * as React from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import server from '../environment';
import axios from 'axios';

export default function Authentication() {
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [showResend, setShowResend] = React.useState(false);
  const [resendEmail, setResendEmail] = React.useState('');
  const { handleRegister, handleLogin, handleResendVerification } = React.useContext(AuthContext);
  const [showForgot, setShowForgot] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [forgotLoading, setForgotLoading] = React.useState(false);
  const navigate = useNavigate();

  // handle token from Google OAuth redirect
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      localStorage.setItem('token', token);
      navigate('/home');
    }

    if (error === 'google_failed') {
      setError('Google sign in failed. Please try again.');
    }
  }, []);

  const handleAuth = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    setShowResend(false);
    try {
      if (formState === 0) {
        await handleLogin(username, password);
      } else {
        const result = await handleRegister(name, username, email, password);
        setUsername(''); setPassword(''); setName(''); setEmail('');
        setMessage(result);
        setOpen(true);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Something went wrong.';
      setError(msg);
      // show resend button if user is not verified
      if (msg === 'Please verify your email before logging in') {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!resendEmail) {
      setError('Please enter your email to resend verification.');
      return;
    }
    try {
      setLoading(true);
      const msg = await handleResendVerification(resendEmail);
      setMessage(msg);
      setOpen(true);
      setShowResend(false);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to resend email.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${server}/api/v1/users/auth/google`;
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
        setError('Please enter your email.');
        return;
    }
    setForgotLoading(true);
    setError('');
    try {
        const res = await axios.post(`${server}/api/v1/users/forgot-password`, { email: forgotEmail });
        setMessage(res.data.message);
        setOpen(true);
        setShowForgot(false);
        setForgotEmail('');
    } catch (err) {
        setError(err?.response?.data?.message || 'Something went wrong.');
    } finally {
        setForgotLoading(false);
    }
};

  return (
    <div className="authPageContainer" style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <img 
              src="/callifyLogo.png" 
              alt="Callify" 
              style={{ width: '28px', height: '28px', objectFit: 'contain', mixBlendMode: 'screen' }} 
          />
          Callify
      </div>

        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(formState === 0 ? s.tabOn : {}) }}
            onClick={() => { setFormState(0); setError(''); setShowResend(false); }}
          >
            Sign in
          </button>
          <button
            style={{ ...s.tab, ...(formState === 1 ? s.tabOn : {}) }}
            onClick={() => { setFormState(1); setError(''); setShowResend(false); }}
          >
            Sign up
          </button>
        </div>

        <div style={s.fields}>
          {formState === 1 && (
            <div style={s.field}>
              <label style={s.label}>Full name</label>
              <input
                style={s.input} type="text" placeholder="John Doe"
                value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAuth()} autoFocus
              />
            </div>
          )}
          <div style={s.field}>
            <label style={s.label}>Username</label>
            <input
              style={s.input} type="text" placeholder="your_username"
              value={username} onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              autoFocus={formState === 0}
            />
          </div>
          {/* Email only shown on Sign Up tab */}
          {formState === 1 && (
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input
                style={s.input} type="email" placeholder="your_email@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAuth()}
              />
            </div>
          )}
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              style={s.input} type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
          </div>
        </div>
          {/* Forgot password link — only on sign in tab */}
            {formState === 0 && (
                <button
                    style={s.forgotLink}
                    onClick={() => { setShowForgot(!showForgot); setError(''); }}
                >
                    {showForgot ? 'Hide' : 'Forgot password?'}
                </button>
            )}

            {/* Forgot password form */}
            {showForgot && formState === 0 && (
                <div style={s.resendBox}>
                    <p style={s.resendText}>Enter your email to receive a reset link:</p>
                    <input
                        style={s.input} type="email" placeholder="your_email@example.com"
                        value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleForgotPassword()}
                    />
                    <button style={s.resendBtn} onClick={handleForgotPassword} disabled={forgotLoading}>
                        {forgotLoading ? 'Sending…' : 'Send reset link'}
                    </button>
                </div>
            )}
        {error && <p style={s.error}>{error}</p>}

        {/* Resend verification section */}
        {showResend && (
          <div style={s.resendBox}>
            <p style={s.resendText}>Enter your email to resend the verification link:</p>
            <input
              style={s.input} type="email" placeholder="your_email@example.com"
              value={resendEmail} onChange={e => setResendEmail(e.target.value)}
            />
            <button style={s.resendBtn} onClick={handleResend} disabled={loading}>
              {loading ? 'Sending…' : 'Resend verification email'}
            </button>
          </div>
        )}

        <button
          style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
          onClick={handleAuth} disabled={loading}
        >
          {loading ? 'Please wait…' : formState === 0 ? 'Sign in' : 'Create account'}
        </button>
        {/* Divider */}
        <div style={s.divider}>
          <div style={s.dividerLine} />
          <span style={s.dividerText}>or</span>
          <div style={s.dividerLine} />
        </div>

        {/* Google button */}
        <button style={s.googleBtn} onClick={handleGoogleLogin}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.1 4 9.3 8.4 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7l-6.6 4.8C9.4 39.7 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.2 5.2C41 35.3 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continue with Google
        </button>
      </div>

      <Snackbar
        open={open} autoHideDuration={4000}
        onClose={() => setOpen(false)} message={message}
      />
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '1.5rem',
  },
  card: {
    width: '100%', maxWidth: '380px', background: '#141417',
    border: '1px solid #2a2a30', borderRadius: '16px',
    padding: '2.2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.4rem',
  },
  logo: { fontSize: '1.1rem', fontWeight: '700', letterSpacing: '-0.02em', color: '#f0f0f4', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'center' },
  tabs: { display: 'flex', background: '#1c1c21', borderRadius: '8px', padding: '3px', gap: '3px' },
  tab: {
    flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px',
    background: 'transparent', color: '#9090a0', fontSize: '0.85rem',
    fontWeight: '500', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.15s',
  },
  tabOn: { background: '#2a2a30', color: '#f0f0f4' },
  fields: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.78rem', fontWeight: '500', color: '#9090a0' },
  input: {
    padding: '0.65rem 0.9rem', background: '#1c1c21', border: '1px solid #2a2a30',
    borderRadius: '8px', color: '#f0f0f4', fontSize: '0.9rem', outline: 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'border-color 0.15s',
  },
  error: {
    fontSize: '0.82rem', color: '#f75555', background: 'rgba(247,85,85,0.08)',
    border: '1px solid rgba(247,85,85,0.2)', borderRadius: '7px',
    padding: '0.6rem 0.9rem', margin: 0,
  },
  btn: {
    padding: '0.72rem', 
    background: 'linear-gradient(135deg, #FFEB3B 0%, #FF5722 100%)',
    border: 'none', borderRadius: '8px',
    color: '#1a1a1d', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
    fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'opacity 0.15s, transform 0.15s',
  },
  divider: { display: 'flex', alignItems: 'center', gap: '0.8rem' },
  dividerLine: { flex: 1, height: '1px', background: '#2a2a30' },
  dividerText: { fontSize: '0.78rem', color: '#55555f' },
  googleBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
    padding: '0.72rem', background: '#1c1c21', border: '1px solid #2a2a30',
    borderRadius: '8px', color: '#f0f0f4', fontSize: '0.9rem', fontWeight: '500',
    cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'border-color 0.15s',
  },
  resendBox: { display: 'flex', flexDirection: 'column', gap: '0.7rem' },
  resendText: { fontSize: '0.82rem', color: '#9090a0', margin: 0 },
  resendBtn: {
    padding: '0.6rem', background: 'transparent', 
    border: '1px solid #FF8C00',
    borderRadius: '8px', color: '#FF8C00', fontSize: '0.85rem', fontWeight: '600',
    cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  forgotLink: {
    background: 'transparent', border: 'none',
    color: '#FF8C00', fontSize: '0.8rem', cursor: 'pointer',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    textAlign: 'right', padding: 0, alignSelf: 'flex-end',
},
};