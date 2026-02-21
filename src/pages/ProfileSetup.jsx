import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { useAuth, calcLevel, getFrame } from '../context/AuthContext';

const COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#ec4899', '#f97316', '#8b5cf6'];

export default function ProfileSetup() {
    const navigate = useNavigate();
    const socket = useSocket();
    const { setProfile, setRoom, setGameList } = useGame();
    const { user, playerData } = useAuth();
    const fileInputRef = useRef(null);

    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [selectedColor, setSelectedColor] = useState(0);
    const [roomCode, setRoomCode] = useState('');
    const [mode, setMode] = useState('home');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // تحميل بيانات المستخدم من Firebase تلقائياً
    useEffect(() => {
        if (playerData) {
            if (playerData.name) setName(playerData.name);
            if (playerData.avatarUrl) setAvatarUrl(playerData.avatarUrl);
            const ci = COLORS.indexOf(playerData.color);
            if (ci >= 0) setSelectedColor(ci);
        }
    }, [playerData]);

    const level = playerData ? calcLevel(playerData.xp || 0).level : 1;
    const frame = getFrame(level);

    const profile = {
        name: name.trim(),
        avatar: avatarUrl,           // صورة base64 أو null
        color: COLORS[selectedColor],
    };

    function handleImageChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setError('حجم الصورة يجب أن يكون أقل من 2MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarUrl(ev.target.result);
        reader.readAsDataURL(file);
        setError('');
    }

    function handleCreate() {
        if (!name.trim()) return setError('أدخل اسمك أولاً');
        setLoading(true);
        socket.emit('room:create', { profile }, ({ room, gameList }) => {
            setProfile(profile);
            setRoom(room);
            setGameList(gameList);
            navigate('/lobby');
        });
    }

    function handleJoin() {
        if (!name.trim()) return setError('أدخل اسمك أولاً');
        if (!roomCode.trim()) return setError('أدخل كود الغرفة');
        setLoading(true);
        socket.emit('room:join', { roomCode: roomCode.trim(), profile }, (res) => {
            if (res.error) { setError(res.error); setLoading(false); return; }
            setProfile(profile);
            setRoom(res.room);
            setGameList(res.gameList);
            navigate('/lobby');
        });
    }

    // مكوّن عرض الصورة / placeholder
    function AvatarPreview({ size = 80 }) {
        return avatarUrl ? (
            <img
                src={avatarUrl}
                alt="avatar"
                style={{
                    width: size, height: size, borderRadius: '50%',
                    objectFit: 'cover',
                    border: `3px solid ${COLORS[selectedColor]}`,
                    boxShadow: `0 0 16px ${COLORS[selectedColor]}60`,
                }}
            />
        ) : (
            <div style={{
                width: size, height: size, borderRadius: '50%',
                background: `linear-gradient(135deg, ${COLORS[selectedColor]}, ${COLORS[selectedColor]}80)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: size * 0.4, color: 'white', fontWeight: 900,
                border: `3px solid ${COLORS[selectedColor]}`,
            }}>
                {name.trim() ? name.trim()[0].toUpperCase() : '?'}
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-content">
                {/* Profile button - أيقونة الملف الشخصي */}
                {playerData && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                        <Link to="/profile" style={{ textDecoration: 'none' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 14px', borderRadius: 50,
                                background: 'var(--glass)', backdropFilter: 'blur(10px)',
                                border: `1px solid ${frame.color}40`,
                                cursor: 'pointer', transition: 'all 0.2s',
                            }}>
                                <div style={{ position: 'relative' }}>
                                    {avatarUrl ? (
                                        <img src={avatarUrl} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${frame.color}` }} />
                                    ) : (
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS[selectedColor]}, ${COLORS[selectedColor]}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: 'white', border: `2px solid ${frame.color}` }}>
                                            {name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                    <div style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 10, background: frame.color, borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{frame.icon}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{playerData.name}</div>
                                    <div style={{ fontSize: 11, color: frame.color }}>Lv.{level} {frame.label}</div>
                                </div>
                                <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>🪙 {(playerData.coins || 0).toLocaleString()}</div>
                            </div>
                        </Link>
                    </motion.div>
                )}

                {/* Logo */}
                <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center" style={{ marginBottom: 40 }}
                >
                    <div style={{ fontSize: 64, marginBottom: 8 }} className="animate-float">🎮</div>
                    <h1 className="title gradient-text">تتحدى؟</h1>
                    <p className="subtitle">من يقدر يتحدى</p>
                </motion.div>


                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="card card-lg"
                >
                    {mode === 'home' && (
                        <div className="flex flex-col gap-4">
                            <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>مرحباً بك! 👋</h2>

                            {/* صورة الملف الشخصي */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <AvatarPreview size={96} />

                                {/* زر رفع الصورة */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleImageChange}
                                />
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        📷 رفع صورة
                                    </button>
                                    {avatarUrl && (
                                        <button
                                            className="btn btn-sm"
                                            style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)' }}
                                            onClick={() => { setAvatarUrl(null); fileInputRef.current.value = ''; }}
                                        >
                                            🗑️ حذف
                                        </button>
                                    )}
                                </div>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {avatarUrl ? '✅ تم رفع الصورة' : 'اختياري - بدون صورة سيظهر أول حرف من اسمك'}
                                </p>
                            </div>

                            {/* الاسم */}
                            <div>
                                <label className="label">اسمك في اللعبة</label>
                                <input
                                    className="input"
                                    placeholder="أدخل اسمك..."
                                    value={name}
                                    onChange={e => { setName(e.target.value); setError(''); }}
                                    maxLength={20}
                                />
                            </div>

                            {/* لون الملف */}
                            <div>
                                <label className="label">لون ملفك</label>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {COLORS.map((c, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedColor(i)}
                                            style={{
                                                width: 36, height: 36, borderRadius: '50%', background: c, cursor: 'pointer',
                                                border: selectedColor === i ? '3px solid white' : '3px solid transparent',
                                                boxShadow: selectedColor === i ? `0 0 10px ${c}` : 'none',
                                                transition: 'all 0.2s',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {error && <p style={{ color: 'var(--danger)', textAlign: 'center', fontSize: 14 }}>{error}</p>}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                                <button className="btn btn-primary btn-lg" onClick={() => { if (!name.trim()) { setError('أدخل اسمك أولاً'); return; } setMode('create'); setError(''); }}>
                                    🏠 إنشاء غرفة
                                </button>
                                <button className="btn btn-secondary btn-lg" onClick={() => { if (!name.trim()) { setError('أدخل اسمك أولاً'); return; } setMode('join'); setError(''); }}>
                                    🚪 انضمام
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'create' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                            <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center' }}>إنشاء غرفة جديدة 🏠</h2>
                            <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                <AvatarPreview size={72} />
                                <div style={{ fontWeight: 700, marginTop: 4 }}>{name}</div>
                                <div className="badge badge-primary">Admin 👑</div>
                            </div>
                            {error && <p style={{ color: 'var(--danger)', textAlign: 'center', fontSize: 14 }}>{error}</p>}
                            <button className="btn btn-primary btn-lg btn-full" onClick={handleCreate} disabled={loading}>
                                {loading ? '⏳ جاري الإنشاء...' : '🚀 إنشاء الغرفة'}
                            </button>
                            <button className="btn btn-secondary btn-full" onClick={() => { setMode('home'); setError(''); }}>← رجوع</button>
                        </motion.div>
                    )}

                    {mode === 'join' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                            <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center' }}>الانضمام لغرفة 🚪</h2>
                            <div>
                                <label className="label">كود الغرفة</label>
                                <input
                                    className="input"
                                    placeholder="مثال: ABC123"
                                    value={roomCode}
                                    onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
                                    maxLength={6}
                                    style={{ textAlign: 'center', fontSize: 24, letterSpacing: 4, fontWeight: 700 }}
                                />
                            </div>
                            {error && <p style={{ color: 'var(--danger)', textAlign: 'center', fontSize: 14 }}>{error}</p>}
                            <button className="btn btn-primary btn-lg btn-full" onClick={handleJoin} disabled={loading}>
                                {loading ? '⏳ جاري الانضمام...' : '✅ انضمام'}
                            </button>
                            <button className="btn btn-secondary btn-full" onClick={() => { setMode('home'); setError(''); }}>← رجوع</button>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
