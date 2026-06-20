import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";
import server from "../environment";
import { Snackbar } from "@mui/material";

export default function Profile() {
    const { handleUpdateProfile } = useContext(AuthContext);
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isGoogleUser, setIsGoogleUser] = useState(false);

    // delete dialog states
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${server}/api/v1/users/me`);
                setName(res.data.name);
                setUsername(res.data.username);
                setEmail(res.data.email);
                setIsGoogleUser(res.data.isGoogleUser);
            } catch (err) {
                if (err?.response?.status === 401) navigate('/auth');
                setError('Failed to load profile.');
            } finally {
                setFetching(false);
            }
        };
        fetchUser();
    }, []);

    const handleSave = async () => {
        if (!name.trim() || !username.trim()) {
            setError('Name and username cannot be empty.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await handleUpdateProfile(name.trim(), username.trim());
            setMessage(res.message);
            setOpen(true);
        } catch (err) {
            setError(err?.response?.data?.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        setDeleteError('');
        try {
            await axios.delete(`${server}/api/v1/users/profile`, {
                data: { password: deletePassword }
            });
            await axios.post(`${server}/api/v1/users/logout`);
            navigate('/auth');
        } catch (err) {
            setDeleteError(err?.response?.data?.message || 'Something went wrong.');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="profilePageContainer" style={s.page}>
                <div style={s.card}>
                    <div style={s.spinner} />
                    <p style={s.sub}>Loading profile…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profilePageContainer" style={s.page}>
            <div style={s.card}>

                {/* Header */}
                <div style={s.header}>
                    <button style={s.backBtn} onClick={() => navigate('/home')}>← Back</button>
                    <div style={s.logo}>Edit Profile</div>
                    <div style={{ width: '48px' }} />
                </div>

                {/* Avatar */}
                <div style={s.avatarWrap}>
                    <div style={s.avatar}>
                        {name ? name[0].toUpperCase() : '?'}
                    </div>
                    <p style={s.avatarSub}>{email}</p>
                </div>

                {/* Fields */}
                <div style={s.fields}>
                    <div style={s.field}>
                        <label style={s.label}>Full name</label>
                        <input
                            style={s.input} type="text" placeholder="John Doe"
                            value={name} onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSave()}
                        />
                    </div>
                    <div style={s.field}>
                        <label style={s.label}>Username</label>
                        <input
                            style={s.input} type="text" placeholder="your_username"
                            value={username} onChange={e => setUsername(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSave()}
                        />
                    </div>
                    <div style={s.field}>
                        <label style={s.label}>Email</label>
                        <input
                            style={{ ...s.input, ...s.inputDisabled }}
                            type="email" value={email} disabled
                        />
                        <span style={s.hint}>Email cannot be changed</span>
                    </div>
                </div>

                {error && <p style={s.error}>{error}</p>}

                <button
                    style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
                    onClick={handleSave} disabled={loading}
                >
                    {loading ? 'Saving…' : 'Save Changes'}
                </button>

                {/* Divider */}
                <div style={s.divider} />

                {/* Delete account */}
                <div style={s.dangerZone}>
                    <p style={s.dangerTitle}>Danger Zone</p>
                    <p style={s.dangerSub}>Once you delete your account, all your data and meeting history will be permanently removed.</p>
                    <button style={s.deleteBtn} onClick={() => { setShowDeleteDialog(true); setDeleteError(''); }}>
                        Delete Account
                    </button>
                </div>
            </div>

            {/* Delete confirmation dialog */}
            {showDeleteDialog && (
                <div style={s.overlay}>
                    <div style={s.dialog}>
                        <p style={s.dialogTitle}>Delete Account</p>
                        <p style={s.dialogSub}>This action is permanent and cannot be undone. All your data will be deleted.</p>

                        {/* only ask password for non-Google users */}
                        {!isGoogleUser && (
                            <div style={s.field}>
                                <label style={s.label}>Enter your password to confirm</label>
                                <input
                                    style={s.input} type="password" placeholder="••••••••"
                                    value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleDeleteAccount()}
                                    autoFocus
                                />
                            </div>
                        )}

                        {deleteError && <p style={s.error}>{deleteError}</p>}

                        <div style={s.dialogBtns}>
                            <button
                                style={s.cancelBtn}
                                onClick={() => { setShowDeleteDialog(false); setDeletePassword(''); setDeleteError(''); }}
                            >
                                Cancel
                            </button>
                            <button
                                style={{ ...s.confirmDeleteBtn, opacity: deleteLoading ? 0.6 : 1 }}
                                onClick={handleDeleteAccount} disabled={deleteLoading}
                            >
                                {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Snackbar
                open={open} autoHideDuration={3000}
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
        width: '100%', maxWidth: '400px', background: '#141417',
        border: '1px solid #2a2a30', borderRadius: '16px',
        padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.4rem',
    },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    logo: { fontSize: '1rem', fontWeight: '700', color: '#f0f0f4', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'center' },
    backBtn: {
        background: 'transparent', border: 'none', color: '#ff8c00',
        fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 0,
    },
    avatarWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },
    avatar: {
        width: '72px', height: '72px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #FFEB3B, #FF5722)', border: '2px solid #2a2a30',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.8rem', fontWeight: '700', color: '#fff',
    },
    avatarSub: { fontSize: '0.82rem', color: '#55555f', margin: 0 },
    fields: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { fontSize: '0.78rem', fontWeight: '500', color: '#9090a0' },
    input: {
        padding: '0.65rem 0.9rem', background: '#1c1c21', border: '1px solid #2a2a30',
        borderRadius: '8px', color: '#f0f0f4', fontSize: '0.9rem', outline: 'none',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    inputDisabled: { color: '#55555f', cursor: 'not-allowed', background: '#141417' },
    hint: { fontSize: '0.72rem', color: '#55555f' },
    error: {
        fontSize: '0.82rem', color: '#f75555', background: 'rgba(247,85,85,0.08)',
        border: '1px solid rgba(247,85,85,0.2)', borderRadius: '7px',
        padding: '0.6rem 0.9rem', margin: 0,
    },
    btn: {
        padding: '0.72rem', background: 'linear-gradient(135deg, #FFEB3B 0%, #FF5722 100%)', border: 'none', borderRadius: '8px',
        color: '#1a1a1d', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    divider: { height: '1px', background: '#2a2a30' },
    dangerZone: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
    dangerTitle: { fontSize: '0.85rem', fontWeight: '600', color: '#f75555', margin: 0 },
    dangerSub: { fontSize: '0.8rem', color: '#55555f', margin: 0, lineHeight: '1.5' },
    deleteBtn: {
        padding: '0.65rem', background: 'transparent',
        border: '1px solid rgba(247,85,85,0.3)', borderRadius: '8px',
        color: '#f75555', fontSize: '0.88rem', fontWeight: '600',
        cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: '1.5rem',
    },
    dialog: {
        width: '100%', maxWidth: '360px', background: '#141417',
        border: '1px solid #2a2a30', borderRadius: '16px',
        padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1rem',
    },
    dialogTitle: { fontSize: '1rem', fontWeight: '700', color: '#f75555', margin: 0 },
    dialogSub: { fontSize: '0.82rem', color: '#9090a0', margin: 0, lineHeight: '1.5' },
    dialogBtns: { display: 'flex', gap: '0.6rem', marginTop: '0.4rem' },
    cancelBtn: {
        flex: 1, padding: '0.65rem', background: 'transparent',
        border: '1px solid #2a2a30', borderRadius: '8px',
        color: '#9090a0', fontSize: '0.88rem', fontWeight: '500',
        cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    confirmDeleteBtn: {
        flex: 1, padding: '0.65rem', background: 'linear-gradient(135deg, #FFEB3B 0%, #FF5722 100%)',
        border: 'none', borderRadius: '8px',
        color: '#1a1a1d', fontSize: '0.88rem', fontWeight: '600',
        cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    spinner: {
        width: '36px', height: '36px', borderRadius: '50%',
        border: '3px solid #2a2a30', borderTop: '3px solid #FF8C00',
        animation: 'spin 0.8s linear infinite', alignSelf: 'center',
    },
    sub: { fontSize: '0.85rem', color: '#9090a0', margin: 0, textAlign: 'center' },
};