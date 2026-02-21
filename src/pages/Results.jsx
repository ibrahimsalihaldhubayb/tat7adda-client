import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useGame } from '../context/GameContext';
import { useAuth, calcMatchXP, calcLevel, getFrame } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = ['#fbbf24', '#94a3b8', '#cd7c2f'];

// ─── مكوّن عملة طائرة ─────────────────────────────────────
function FlyingCoin({ delay, startX, startY }) {
    return (
        <motion.div
            initial={{ x: startX, y: startY, opacity: 1, scale: 1 }}
            animate={{
                x: '50vw', y: '-20vh',
                opacity: [1, 1, 0.5, 0],
                scale: [1, 1.3, 0.8, 0],
            }}
            transition={{ duration: 1.8, delay, ease: 'easeInOut' }}
            style={{
                position: 'fixed', zIndex: 999, fontSize: 28,
                pointerEvents: 'none',
            }}
        >
            🪙
        </motion.div>
    );
}

// ─── كونفيتي ─────────────────────────────────────
function Confetti({ count = 30 }) {
    const items = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: ['#fbbf24', '#c084fc', '#38bdf8', '#22c55e', '#ef4444'][i % 5],
        delay: Math.random() * 0.8,
        size: Math.random() * 10 + 6,
    }));
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 990, overflow: 'hidden' }}>
            {items.map(item => (
                <motion.div key={item.id}
                    initial={{ x: `${item.x}vw`, y: -20, rotate: 0, opacity: 1 }}
                    animate={{ y: '110vh', rotate: 720, opacity: [1, 1, 0.5, 0] }}
                    transition={{ duration: 3 + Math.random() * 2, delay: item.delay, ease: 'easeIn' }}
                    style={{
                        position: 'absolute', width: item.size, height: item.size,
                        background: item.color, borderRadius: 2,
                    }}
                />
            ))}
        </div>
    );
}

export default function Results() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { profile, room, setRoom } = useGame();
    const { user, playerData, updatePlayerData } = useAuth();
    const socket = useSocket();
    const saved = useRef(false);

    const [showCelebration, setShowCelebration] = useState(false);
    const [flyingCoins, setFlyingCoins] = useState([]);
    const [showActions, setShowActions] = useState(false);

    const players = state?.players || [];
    const roomCode = state?.roomCode;
    const betAmount = state?.betAmount || 0;
    const isAdmin = room?.adminId === socket?.id;
    const myRank = players.findIndex(p => p.name === profile?.name);
    const myPlayer = players[myRank];
    const winner = players[0];
    const pot = betAmount * players.length;

    // الاستماع للعودة للوبي معاً
    useEffect(() => {
        if (!socket) return;
        socket.on('room:reset_lobby', ({ room: r }) => {
            setRoom(r);
            navigate('/lobby');
        });
        return () => socket.off('room:reset_lobby');
    }, [socket]);

    // تشغيل الاحتفال عند التحميل
    useEffect(() => {
        const t1 = setTimeout(() => setShowCelebration(true), 300);
        const t2 = setTimeout(() => {
            // عملات طائرة
            const coins = Array.from({ length: 12 }, (_, i) => ({
                id: i,
                delay: i * 0.12,
                startX: `${10 + Math.random() * 80}vw`,
                startY: `${40 + Math.random() * 30}vh`,
            }));
            setFlyingCoins(coins);
        }, 600);
        const t3 = setTimeout(() => setShowActions(true), 2000);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    // حفظ نتيجة المباراة في Firebase مرة واحدة
    useEffect(() => {
        if (saved.current || !user || !playerData || myRank < 0 || !myPlayer) return;
        saved.current = true;

        const xpGained = calcMatchXP(myRank + 1, players.length, myPlayer.score || 0);
        const coinsGained = myRank === 0
            ? (betAmount > 0 ? pot : 200)
            : myRank === 1 ? (betAmount > 0 ? 0 : 100)
                : myRank === 2 ? (betAmount > 0 ? 0 : 50)
                    : betAmount > 0 ? 0 : 20;

        const updates = {
            xp: (playerData.xp || 0) + xpGained,
            coins: (playerData.coins || 0) + coinsGained,
            totalMatches: (playerData.totalMatches || 0) + 1,
            totalScore: (playerData.totalScore || 0) + (myPlayer.score || 0),
            firstPlaceCount: (playerData.firstPlaceCount || 0) + (myRank === 0 ? 1 : 0),
            secondPlaceCount: (playerData.secondPlaceCount || 0) + (myRank === 1 ? 1 : 0),
            thirdPlaceCount: (playerData.thirdPlaceCount || 0) + (myRank === 2 ? 1 : 0),
        };

        setDoc(doc(db, 'players', user.uid), updates, { merge: true }).catch(console.error);
        updatePlayerData(user.uid, updates);
    }, [user, playerData, myRank]);

    const xpGained = myPlayer ? calcMatchXP(myRank + 1, players.length, myPlayer.score || 0) : 0;
    const oldLevel = playerData ? calcLevel(playerData.xp || 0).level : 1;
    const newLevel = playerData ? calcLevel((playerData.xp || 0) + xpGained).level : 1;
    const leveledUp = newLevel > oldLevel;
    const frame = getFrame(newLevel);

    return (
        <div className="page" style={{ overflow: 'hidden' }}>

            {/* 🎊 كونفيتي للفائز */}
            {showCelebration && myRank === 0 && <Confetti count={40} />}

            {/* 🪙 عملات طائرة للفائز */}
            {flyingCoins.map(coin => (
                <FlyingCoin key={coin.id} delay={coin.delay} startX={coin.startX} startY={coin.startY} />
            ))}

            <div className="page-content" style={{ maxWidth: 560 }}>
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>

                    {/* ═══ بنر الفائز الاحتفالي ═══ */}
                    {winner && (
                        <motion.div
                            initial={{ y: -30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            style={{ textAlign: 'center', marginBottom: 28, position: 'relative' }}
                        >
                            {/* Glow effect خلف الفائز */}
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{
                                    position: 'absolute', top: '50%', left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: 200, height: 200, borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(251,191,36,0.3), transparent 70%)',
                                    pointerEvents: 'none',
                                }}
                            />

                            <motion.div
                                animate={{ y: [0, -12, 0] }}
                                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ fontSize: 64, display: 'inline-block', marginBottom: 4 }}
                            >
                                👑
                            </motion.div>

                            <motion.h2
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', delay: 0.4, bounce: 0.5 }}
                                style={{
                                    fontSize: 32, fontWeight: 900,
                                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #fbbf24)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    textShadow: 'none',
                                    filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.5))',
                                    marginBottom: 4,
                                }}
                            >
                                {winner.name}
                            </motion.h2>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                style={{ color: 'var(--text-muted)', fontSize: 15 }}
                            >
                                🏆 الفائز بالمباراة
                            </motion.div>

                            {/* الجائزة */}
                            {pot > 0 && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.9, type: 'spring' }}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        marginTop: 12, padding: '10px 20px', borderRadius: 99,
                                        background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))',
                                        border: '1px solid rgba(251,191,36,0.4)',
                                        fontSize: 18, fontWeight: 800, color: '#fbbf24',
                                    }}
                                >
                                    🪙 +{pot.toLocaleString()} عملة
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══ ترقي في المستوى ═══ */}
                    <AnimatePresence>
                        {leveledUp && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0, y: -20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                style={{
                                    textAlign: 'center', padding: '14px', borderRadius: 16,
                                    background: `${frame.color}20`, border: `2px solid ${frame.color}60`,
                                    marginBottom: 16, fontSize: 16, fontWeight: 700, color: frame.color,
                                }}
                            >
                                ⬆️ ترقيت إلى {frame.label}! {frame.icon}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══ ترتيب اللاعبين ═══ */}
                    <div className="card" style={{ marginBottom: 16, padding: '16px 12px' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)' }}>
                            📊 الترتيب النهائي
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {players.map((player, i) => {
                                const isMe = player.name === profile?.name;
                                const isFirst = i === 0;
                                return (
                                    <motion.div
                                        key={player.id || i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '12px 14px', borderRadius: 14,
                                            background: isFirst
                                                ? 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.08))'
                                                : isMe ? 'rgba(192,132,252,0.1)' : 'var(--surface)',
                                            border: `1.5px solid ${isFirst ? 'rgba(251,191,36,0.4)' : isMe ? 'rgba(192,132,252,0.3)' : 'var(--border)'}`,
                                        }}
                                    >
                                        <div style={{ fontSize: 24, minWidth: 32, textAlign: 'center' }}>
                                            {MEDALS[i] || `${i + 1}`}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontWeight: isMe ? 800 : 600,
                                                color: isFirst ? RANK_COLORS[0] : 'var(--text)',
                                                fontSize: 15,
                                            }}>
                                                {player.name} {isMe && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(أنت)</span>}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 800, fontSize: 18, color: isFirst ? '#fbbf24' : 'var(--text)' }}>
                                                {player.score}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>نقطة</div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* موقع اللاعب */}
                        {myRank >= 0 && (
                            <div style={{
                                marginTop: 12, padding: '10px 14px', borderRadius: 10,
                                background: 'var(--surface2)', textAlign: 'center',
                                border: '1px solid var(--border)', fontSize: 14,
                            }}>
                                {myRank === 0 ? '🎉 أنت الفائز! مبروك!' :
                                    myRank === 1 ? '😊 المركز الثاني، أحسنت!' :
                                        myRank === 2 ? '👏 المركز الثالث، جيد!' :
                                            `جاهدت في المركز ${myRank + 1}، حاول مرة أخرى!`}
                            </div>
                        )}

                        {/* XP مكتسبة */}
                        {xpGained > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                style={{
                                    marginTop: 10, display: 'flex', justifyContent: 'center', gap: 16,
                                    fontSize: 13, color: 'var(--text-muted)',
                                }}
                            >
                                <span style={{ color: '#a78bfa' }}>+{xpGained} XP</span>
                                {myRank === 0 && pot > 0 && (
                                    <span style={{ color: '#fbbf24' }}>+{pot.toLocaleString()} 🪙</span>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* ═══ أزرار الإجراءات ═══ */}
                    <AnimatePresence>
                        {showActions && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                            >
                                {/* للأدمن: جولات أخرى */}
                                {isAdmin && roomCode && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                        className="btn btn-primary btn-lg"
                                        style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}
                                        onClick={() => socket?.emit('admin:reset_lobby', { roomCode })}
                                    >
                                        🔄 جولات أخرى مع نفس اللاعبين
                                    </motion.button>
                                )}

                                {/* للجميع: غير الأدمن ينتظر */}
                                {!isAdmin && roomCode && (
                                    <div style={{
                                        padding: '14px', background: 'var(--surface)', borderRadius: 14,
                                        textAlign: 'center', color: 'var(--text-muted)', fontSize: 14,
                                        border: '1px solid var(--border)',
                                    }}>
                                        ⏳ في انتظار قرار الأدمن...
                                    </div>
                                )}

                                {/* خروج */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <Link to="/profile" className="btn btn-secondary btn-lg"
                                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        👤 ملفي
                                    </Link>
                                    <button className="btn btn-secondary btn-lg" onClick={() => navigate('/')}>
                                        🏠 الرئيسية
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </motion.div>
            </div>
        </div>
    );
}
