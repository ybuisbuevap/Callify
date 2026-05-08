import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import server from "../environment";

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [countdown, setCountdown] = useState(5);

    const handleReset = async () => {
        if (!password || !confirm) {
            setError('Please fill in both fields.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await axios.post(`${server}/api/v1/users/reset-password/${token}`, { password });
            setDone(true);

            // countdown then redirect
            let c = 5;
            const interval = setInterval(() => {
                c--;
                setCountdown(c);
                if (c === 0) {
                    clearInterval(interval);
                    navigate('/auth');
                }
            }, 1000);

        } catch (err) {
            setError(err?.response?.data?.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={s.page}>
            <div style={s.card}>
                <div style={s.logo}>
                    <img 
                        src="/callifyLogo.png" 
                        alt="Callify" 
                        style={{ width: '28px', height: '28px', objectFit: 'contain', mixBlendMode: 'screen' }} 
                    />
                    Callify
                </div>

                {done ? (
                    <>
                        <div style={s.icon}>✓</div>
                        <p style={s.title}>Password Reset!</p>
                        <p style={s.sub}>Redirecting to login in <strong style={{ color: '#ff8c00' }}>{countdown}s</strong>…</p>
                        <button style={s.btn} onClick={() => navigate('/auth')}>Go to Login now</button>
                    </>
                ) : (
                    <>
                        <div>
                            <p style={s.title}>Reset your password</p>
                            <p style={s.sub}>Enter a new password for your account.</p>
                        </div>

                        <div style={s.fields}>
                            <div style={s.field}>
                                <label style={s.label}>New password</label>
                                <input
                                    style={s.input} type="password" placeholder="••••••••"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleReset()}
                                    autoFocus
                                />
                            </div>
                            <div style={s.field}>
                                <label style={s.label}>Confirm password</label>
                                <input
                                    style={s.input} type="password" placeholder="••••••••"
                                    value={confirm} onChange={e => setConfirm(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleReset()}
                                />
                            </div>
                        </div>

                        {error && <p style={s.error}>{error}</p>}

                        <button
                            style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
                            onClick={handleReset} disabled={loading}
                        >
                            {loading ? 'Resetting…' : 'Reset Password'}
                        </button>

                        <button style={s.backBtn} onClick={() => navigate('/auth')}>
                            Back to Login
                        </button>
                    </>
                )}
            </div>
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
        alignItems: 'stretch',
    },
    logo: { fontSize: '1.1rem', fontWeight: '700', letterSpacing: '-0.02em', color: '#f0f0f4', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'center' },
    icon: {
        width: '56px', height: '56px', borderRadius: '50%',
        background: 'rgba(255,140,0,0.1)', color: '#ff8c00',
        fontSize: '1.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
        alignSelf: 'center',
    },
    title: { fontSize: '1rem', fontWeight: '700', color: '#f0f0f4', margin: 0, textAlign: 'center' },
    sub: { fontSize: '0.85rem', color: '#9090a0', margin: '0.3rem 0 0', textAlign: 'center' },
    fields: { display: 'flex', flexDirection: 'column', gap: '1rem' },
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
    btn: {
        padding: '0.72rem', background: '#ff8c00', border: 'none', borderRadius: '8px',
        color: '#fff', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    backBtn: {
        padding: '0.5rem', background: 'transparent', border: 'none',
        color: '#9090a0', fontSize: '0.85rem', cursor: 'pointer',
        fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: 'center',
    },
};