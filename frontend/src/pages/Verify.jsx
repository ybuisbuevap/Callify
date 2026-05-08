import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import server from "../environment";

export default function Verify() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    axios.get(`${server}/api/v1/users/verify/${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  // countdown after success
  useEffect(() => {
    if (status !== "success") return;
    if (countdown === 0) { navigate("/"); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown, navigate]);

  return (
    <div style={s.page}>
      <div style={s.card}>
        {status === "loading" && (
          <>
            <div style={s.spinner} />
            <p style={s.title}>Verifying your email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={s.icon}>✓</div>
            <p style={s.title}>Email Verified!</p>
            <p style={s.sub}>Your account is ready. Redirecting to login in <strong style={{ color: '#ff8c00' }}>{countdown}s</strong>…</p>
            <button style={s.btn} onClick={() => navigate("/")}>Go to Login now</button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ ...s.icon, background: 'rgba(247,85,85,0.1)', color: '#f75555' }}>✕</div>
            <p style={s.title}>Verification Failed</p>
            <p style={s.sub}>This link is invalid or has expired.</p>
            <button style={s.btn} onClick={() => navigate("/")}>Back to Login</button>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  card: {
    background: '#141417', border: '1px solid #2a2a30', borderRadius: '16px',
    padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '1.2rem', maxWidth: '360px', width: '100%', textAlign: 'center',
  },
  icon: {
    width: '56px', height: '56px', borderRadius: '50%',
    background: 'rgba(255,140,0,0.1)', color: '#ff8c00',
    fontSize: '1.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  spinner: {
    width: '40px', height: '40px', borderRadius: '50%',
    border: '3px solid #2a2a30', borderTop: '3px solid #ff8c00',
    animation: 'spin 0.8s linear infinite',
  },
  title: { fontSize: '1.15rem', fontWeight: '700', color: '#f0f0f4', margin: 0 },
  sub: { fontSize: '0.88rem', color: '#9090a0', margin: 0 },
  btn: {
    marginTop: '0.5rem', padding: '0.65rem 1.5rem', background: '#ff8c00',
    border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.88rem',
    fontWeight: '600', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
};