import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    collection, getDocs, doc, updateDoc, deleteDoc,
    query, orderBy, limit, getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, calcLevel, getFrame } from '../context/AuthContext';

export default function AdminPanel() {
    const navigate = useNavigate();
    const { user, isAdmin, playerData } = useAuth();

    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [coinAmount, setCoinAmount] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [tab, setTab] = useState('players'); // players | stats

    // حماية: إذا مو أدمن → رجوع
    useEffect(() => {
        if (!loading && !isAdmin) navigate('/');
    }, [isAdmin]);

    useEffect(() => {
        loadPlayers();
    }, []);

    async function loadPlayers() {
        setLoading(true);
        const q = query(collection(db, 'players'), orderBy('coins', 'desc'));
        const snap = await getDocs(q);
        setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
    }

    function showToast(msg, type = 'success') {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }

    async function updateCoins(uid, delta) {
        setActionLoading(true);
        const ref = doc(db, 'players', uid);
        const snap = await getDoc(ref);
        const current = snap.data()?.coins || 0;
        const newCoins = Math.max(0, current + delta);
        await updateDoc(ref, { coins: newCoins });
        setPlayers(prev => prev.map(p => p.id === uid ? { ...p, coins: newCoins } : p));
        if (selectedPlayer?.id === uid) setSelectedPlayer(prev => ({ ...prev, coins: newCoins }));
        showToast(`${delta > 0 ? '➕' : '➖'} ${Math.abs(delta)} عملة لـ ${snap.data()?.name}`);
        setActionLoading(false);
        setCoinAmount('');
    }

    async function blockPlayer(uid, currentBlock) {
        setActionLoading(true);
        const ref = doc(db, 'players', uid);
        await updateDoc(ref, { blocked: !currentBlock });
        setPlayers(prev => prev.map(p => p.id === uid ? { ...p, blocked: !currentBlock } : p));
        if (selectedPlayer?.id === uid) setSelectedPlayer(prev => ({ ...prev, blocked: !currentBlock }));
        showToast((!currentBlock ? '🚫 تم حظر' : '✅ تم رفع الحظر عن') + ' اللاعب');
        setActionLoading(false);
    }

    async function makeAdmin(uid, currentAdmin) {
        setActionLoading(true);
        const ref = doc(db, 'players', uid);
        await updateDoc(ref, { isAdmin: !currentAdmin });
        setPlayers(prev => prev.map(p => p.id === uid ? { ...p, isAdmin: !currentAdmin } : p));
        if (selectedPlayer?.id === uid) setSelectedPlayer(prev => ({ ...prev, isAdmin: !currentAdmin }));
        showToast((!currentAdmin ? '👑 تمت ترقية' : '⬇️ تم إزالة صلاحيات') + ' اللاعب');
        setActionLoading(false);
    }

    const filtered = players.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.id?.includes(search)
    );

    const totalCoins = players.reduce((s, p) => s + (p.coins || 0), 0);
    const totalBlocked = players.filter(p => p.blocked).length;

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{ fontSize: 40 }}>⚙️</motion.div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', padding: '16px', maxWidth: 800, margin: '0 auto' }}>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
                        style={{
                            position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
                            padding: '12px 24px', borderRadius: 14, zIndex: 9999,
                            background: toast.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)',
                            color: 'white', fontWeight: 700, fontSize: 15, backdropFilter: 'blur(8px)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)', whiteSpace: 'nowrap'
                        }}>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')}>← رجوع</button>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: 20, fontWeight: 900 }}>
                        <span style={{
                            background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>⚙️ لوحة التحكم</span>
                    </h1>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Admin Panel</div>
                </div>
                <button className="btn btn-sm" onClick={loadPlayers}
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                    🔄 تحديث
                </button>
            </motion.div>

            {/* Stats Cards */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                {[
                    { label: 'إجمالي اللاعبين', value: players.length, icon: '👥', color: '#7c3aed' },
                    { label: 'إجمالي العملات', value: totalCoins.toLocaleString(), icon: '🪙', color: '#f59e0b' },
                    { label: 'محظورون', value: totalBlocked, icon: '🚫', color: '#ef4444' },
                ].map((s, i) => (
                    <motion.div key={i} initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }}
                        className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
                        <div style={{ fontSize: 26, marginBottom: 4 }}>{s.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Search */}
            <div style={{ marginBottom: 14, position: 'relative' }}>
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="ابحث بالاسم أو الـ ID..."
                    style={{
                        width: '100%', padding: '12px 44px 12px 16px', borderRadius: 12,
                        border: '1.5px solid var(--border)', background: 'var(--surface)',
                        color: 'var(--text)', fontFamily: 'Cairo', fontSize: 14, boxSizing: 'border-box'
                    }} />
            </div>

            {/* Players List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <AnimatePresence>
                    {filtered.map((p, i) => {
                        const pLevel = calcLevel(p.xp || 0).level;
                        const pFrame = getFrame(pLevel);
                        const isMe = p.id === user?.uid;

                        return (
                            <motion.div key={p.id}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.02 }}>

                                {/* Player Row */}
                                <motion.div whileHover={{ x: 2 }}
                                    onClick={() => setSelectedPlayer(selectedPlayer?.id === p.id ? null : p)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                                        background: selectedPlayer?.id === p.id ? 'rgba(124,58,237,0.1)' : 'var(--surface)',
                                        border: `1.5px solid ${selectedPlayer?.id === p.id ? 'rgba(124,58,237,0.4)' : p.blocked ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                                        transition: 'all 0.2s'
                                    }}>

                                    {/* Avatar */}
                                    <div style={{
                                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                                        background: p.avatarUrl ? 'transparent' : `linear-gradient(135deg, ${p.color || '#7c3aed'}, ${p.color || '#7c3aed'}80)`,
                                        border: `2.5px solid ${pFrame.color}`, overflow: 'hidden',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 18, fontWeight: 900, color: 'white',
                                        opacity: p.blocked ? 0.5 : 1
                                    }}>
                                        {p.avatarUrl
                                            ? <img src={p.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : p.name?.[0]?.toUpperCase()}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
                                            {isMe && <span style={{
                                                fontSize: 10, background: 'rgba(124,58,237,0.2)', color: 'var(--primary)',
                                                padding: '2px 8px', borderRadius: 99, fontWeight: 700
                                            }}>أنت</span>}
                                            {p.isAdmin && <span style={{
                                                fontSize: 10, background: 'rgba(245,158,11,0.2)', color: '#f59e0b',
                                                padding: '2px 8px', borderRadius: 99, fontWeight: 700
                                            }}>👑 أدمن</span>}
                                            {p.blocked && <span style={{
                                                fontSize: 10, background: 'rgba(239,68,68,0.2)', color: '#ef4444',
                                                padding: '2px 8px', borderRadius: 99, fontWeight: 700
                                            }}>🚫 محظور</span>}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                            Lv.{pLevel} {pFrame.icon} | 🪙 {(p.coins || 0).toLocaleString()} | {p.totalMatches || 0} مباراة
                                        </div>
                                    </div>

                                    <div style={{ fontSize: 16, color: 'var(--text-muted)' }}>
                                        {selectedPlayer?.id === p.id ? '▲' : '▼'}
                                    </div>
                                </motion.div>

                                {/* Expanded Panel */}
                                <AnimatePresence>
                                    {selectedPlayer?.id === p.id && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                            <div style={{
                                                padding: '14px 16px', borderRadius: '0 0 14px 14px',
                                                background: 'var(--surface)', border: '1.5px solid rgba(124,58,237,0.25)',
                                                borderTop: 'none', marginTop: -4
                                            }}>

                                                {/* Coins Control */}
                                                <div style={{ marginBottom: 12 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                                                        💰 إدارة العملات — الرصيد الحالي:
                                                        <span style={{ color: '#fbbf24', marginRight: 6, fontWeight: 900 }}>
                                                            🪙 {(p.coins || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                                        <input
                                                            type="number" min="1" value={coinAmount}
                                                            onChange={e => setCoinAmount(e.target.value)}
                                                            placeholder="عدد العملات"
                                                            style={{
                                                                width: 130, padding: '9px 12px', borderRadius: 10,
                                                                border: '1.5px solid var(--border)', background: 'var(--surface)',
                                                                color: 'var(--text)', fontFamily: 'Cairo', fontSize: 14
                                                            }} />
                                                        <motion.button whileTap={{ scale: 0.95 }}
                                                            disabled={!coinAmount || actionLoading}
                                                            onClick={() => updateCoins(p.id, +parseInt(coinAmount))}
                                                            style={{
                                                                padding: '9px 16px', borderRadius: 10, border: 'none',
                                                                cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 700, fontSize: 13,
                                                                background: 'rgba(16,185,129,0.15)', color: '#10b981',
                                                                border: '1px solid rgba(16,185,129,0.3)'
                                                            }}>
                                                            ➕ إضافة
                                                        </motion.button>
                                                        <motion.button whileTap={{ scale: 0.95 }}
                                                            disabled={!coinAmount || actionLoading}
                                                            onClick={() => updateCoins(p.id, -parseInt(coinAmount))}
                                                            style={{
                                                                padding: '9px 16px', borderRadius: 10, border: 'none',
                                                                cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 700, fontSize: 13,
                                                                background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                                                                border: '1px solid rgba(239,68,68,0.25)'
                                                            }}>
                                                            ➖ سحب
                                                        </motion.button>
                                                    </div>

                                                    {/* Preset amounts */}
                                                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                                        {[100, 500, 1000, 5000, 10000].map(amt => (
                                                            <button key={amt} onClick={() => setCoinAmount(String(amt))}
                                                                style={{
                                                                    padding: '5px 10px', borderRadius: 8, border: 'none',
                                                                    cursor: 'pointer', fontSize: 12, fontFamily: 'Cairo',
                                                                    background: coinAmount === String(amt) ? 'rgba(245,158,11,0.2)' : 'var(--surface2)',
                                                                    color: coinAmount === String(amt) ? '#f59e0b' : 'var(--text-muted)',
                                                                    fontWeight: 700
                                                                }}>
                                                                {amt.toLocaleString()}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div style={{ height: 1, background: 'var(--border)', marginBottom: 12 }} />

                                                {/* Actions */}
                                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                    {!isMe && (
                                                        <>
                                                            <motion.button whileTap={{ scale: 0.95 }}
                                                                disabled={actionLoading}
                                                                onClick={() => blockPlayer(p.id, p.blocked)}
                                                                style={{
                                                                    padding: '9px 14px', borderRadius: 10, border: 'none',
                                                                    cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 700, fontSize: 13,
                                                                    background: p.blocked ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
                                                                    color: p.blocked ? '#10b981' : '#ef4444',
                                                                    border: `1px solid ${p.blocked ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`
                                                                }}>
                                                                {p.blocked ? '✅ رفع الحظر' : '🚫 حظر اللاعب'}
                                                            </motion.button>

                                                            <motion.button whileTap={{ scale: 0.95 }}
                                                                disabled={actionLoading}
                                                                onClick={() => makeAdmin(p.id, p.isAdmin)}
                                                                style={{
                                                                    padding: '9px 14px', borderRadius: 10, border: 'none',
                                                                    cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 700, fontSize: 13,
                                                                    background: p.isAdmin ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                                                                    color: p.isAdmin ? '#ef4444' : '#f59e0b',
                                                                    border: `1px solid ${p.isAdmin ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`
                                                                }}>
                                                                {p.isAdmin ? '⬇️ إزالة الأدمن' : '👑 منح صلاحية أدمن'}
                                                            </motion.button>
                                                        </>
                                                    )}

                                                    {/* Player Details */}
                                                    <div style={{
                                                        flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap',
                                                        padding: '8px 12px', borderRadius: 10, background: 'var(--surface2)',
                                                        fontSize: 12, color: 'var(--text-muted)', alignItems: 'center'
                                                    }}>
                                                        <span>🎮 {p.totalMatches || 0} مباراة</span>
                                                        <span>🥇 {p.firstPlaceCount || 0} أول</span>
                                                        <span>⭐ {p.xp || 0} XP</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {filtered.length === 0 && !loading && (
                    <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
                        <p>لا توجد نتائج</p>
                    </div>
                )}
            </div>

            {/* Quick link to Questions Editor */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{
                    marginTop: 20, padding: '14px 18px', borderRadius: 14,
                    background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>📝 محرر الأسئلة</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>تعديل وإضافة أسئلة الألعاب</div>
                </div>
                <button className="btn btn-sm" onClick={() => navigate('/questions')}
                    style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--primary)', border: '1px solid rgba(124,58,237,0.3)' }}>
                    فتح →
                </button>
            </motion.div>
        </div>
    );
}
