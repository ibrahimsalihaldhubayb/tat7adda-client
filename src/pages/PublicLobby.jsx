import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const TIER_BG = {
    bronze: 'linear-gradient(135deg, #7c4a03, #cd7f32)',
    silver: 'linear-gradient(135deg, #555, #aaa9ad)',
    gold: 'linear-gradient(135deg, #7a6000, #ffd700)',
    diamond: 'linear-gradient(135deg, #0066aa, #b9f2ff)',
    royal: 'linear-gradient(135deg, #4a0080, #c084fc)',
};

export default function PublicLobby() {
    const navigate = useNavigate();
    const socket = useSocket();
    const { playerData } = useAuth();
    const { setRoom, setIsPublicGame } = useGame();

    const [tiers, setTiers] = useState([]);
    const [joining, setJoining] = useState(null);
    const [waitingTier, setWaitingTier] = useState(null);
    const [waitingCount, setWaitingCount] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTiers();
        const interval = setInterval(fetchTiers, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('public:waiting', ({ tierId, count }) => {
            if (waitingTier?.id === tierId) setWaitingCount(count);
        });

        socket.on('public:match_found', ({ room, tier, pot }) => {
            setWaitingTier(null);
            setRoom(room);
            if (setIsPublicGame) setIsPublicGame({ tier, pot });
            navigate('/game');
        });

        return () => {
            socket.off('public:waiting');
            socket.off('public:match_found');
        };
    }, [socket, waitingTier]);

    async function fetchTiers() {
        try {
            const res = await fetch(`${SERVER_URL}/tiers`);
            const data = await res.json();
            setTiers(data);
        } catch { }
    }

    function joinTier(tier) {
        if (!socket || !playerData) return;
        if ((playerData.coins || 0) < tier.entryFee) {
            setError(`عملاتك غير كافية! تحتاج ${tier.entryFee} عملة`);
            setTimeout(() => setError(''), 3000);
            return;
        }
        setJoining(tier.id);
        socket.emit('public:join', {
            tierId: tier.id,
            profile: { name: playerData.name, avatar: playerData.avatar },
            coins: playerData.coins || 0,
        }, (res) => {
            setJoining(null);
            if (res.error) {
                setError(res.error);
                setTimeout(() => setError(''), 3000);
            } else {
                setWaitingTier(tier);
                setWaitingCount(tier.waiting + 1);
            }
        });
    }

    function leaveQueue() {
        if (!socket) return;
        socket.emit('public:leave', {}, () => {
            setWaitingTier(null);
            setWaitingCount(0);
        });
    }

    if (waitingTier) {
        return (
            <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                        background: TIER_BG[waitingTier.id],
                        borderRadius: 24,
                        padding: '40px 60px',
                        textAlign: 'center',
                        boxShadow: '0 0 40px rgba(0,0,0,0.4)',
                    }}
                >
                    <div style={{ fontSize: 64 }}>{waitingTier.icon}</div>
                    <h2 style={{ fontFamily: 'Cairo', color: '#fff', margin: '12px 0 4px' }}>
                        غرفة {waitingTier.name}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Cairo' }}>
                        {waitingTier.entryFee} عملة • الجائزة: {waitingTier.entryFee * waitingCount} عملة
                    </p>
                    <div style={{ marginTop: 24 }}>
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            style={{ fontSize: 40 }}
                        >
                            ⏳
                        </motion.div>
                        <p style={{ color: '#fff', fontFamily: 'Cairo', fontSize: 18, marginTop: 8 }}>
                            في الانتظار... {waitingCount} لاعب
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Cairo', fontSize: 14 }}>
                            تبدأ اللعبة فور انضمام لاعب آخر
                        </p>
                    </div>
                    <button
                        onClick={leaveQueue}
                        style={{
                            marginTop: 24, padding: '10px 28px', borderRadius: 12,
                            background: 'rgba(255,255,255,0.15)', color: '#fff',
                            border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer',
                            fontFamily: 'Cairo', fontSize: 15,
                        }}
                    >
                        ❌ إلغاء
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="page" style={{ direction: 'rtl', fontFamily: 'Cairo' }}>
            <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <button onClick={() => navigate('/')} style={{
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '8px 14px', color: 'var(--text)',
                        cursor: 'pointer', fontFamily: 'Cairo',
                    }}>← رجوع</button>
                    <h1 style={{ margin: 0, fontSize: 22, color: 'var(--text)' }}>🏟️ الغرف العامة</h1>
                </div>

                <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>
                    💰 عملاتك: <strong style={{ color: 'var(--primary)' }}>{playerData?.coins ?? 0}</strong> عملة
                </p>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                                color: '#ef4444', fontFamily: 'Cairo', textAlign: 'center',
                            }}
                        >
                            ⚠️ {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tier Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {tiers.map((tier, i) => (
                        <motion.div
                            key={tier.id}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.07 }}
                            style={{
                                background: TIER_BG[tier.id] || 'var(--surface)',
                                borderRadius: 20,
                                padding: '20px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <span style={{ fontSize: 44 }}>{tier.icon}</span>
                                <div>
                                    <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{tier.name}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>
                                        دخول: {tier.entryFee} عملة • الجائزة: حتى {tier.entryFee * tier.maxPlayers} عملة
                                    </div>
                                    {tier.waiting > 0 && (
                                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
                                            🟢 {tier.waiting} ينتظر
                                        </div>
                                    )}
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => joinTier(tier)}
                                disabled={joining === tier.id || (playerData?.coins ?? 0) < tier.entryFee}
                                style={{
                                    background: joining === tier.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.25)',
                                    border: '1px solid rgba(255,255,255,0.4)',
                                    borderRadius: 12, padding: '10px 22px',
                                    color: '#fff', cursor: joining === tier.id ? 'not-allowed' : 'pointer',
                                    fontFamily: 'Cairo', fontSize: 15, fontWeight: 600,
                                    opacity: (playerData?.coins ?? 0) < tier.entryFee ? 0.5 : 1,
                                }}
                            >
                                {joining === tier.id ? '⏳' : 'انضمام'}
                            </motion.button>
                        </motion.div>
                    ))}
                </div>

                {tiers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        ⏳ جاري التحميل...
                    </div>
                )}
            </div>
        </div>
    );
}
