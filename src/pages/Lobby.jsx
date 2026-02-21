import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';

const TIME_OPTIONS = [
    { label: '⚡ سريع', value: 15, desc: '15 ثانية' },
    { label: '⏱️ عادي', value: 30, desc: '30 ثانية' },
    { label: '🐢 بطيء', value: 60, desc: '60 ثانية' },
];

const BET_OPTIONS = [
    { label: '20', value: 20, icon: '🥉', color: '#cd7f32' },
    { label: '50', value: 50, icon: '🥈', color: '#aaa9ad' },
    { label: '100', value: 100, icon: '🥇', color: '#ffd700' },
    { label: '500', value: 500, icon: '💎', color: '#38bdf8' },
    { label: '1000', value: 1000, icon: '👑', color: '#c084fc' },
];

// ألوان مميزة لكل لعبة
const GAME_COLORS = {
    'speed-math': { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.4)', glow: '#ef4444' },
    'trivia': { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.4)', glow: '#3b82f6' },
    'memory-grid': { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.4)', glow: '#a855f7' },
    'reaction': { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', glow: '#f59e0b' },
    'logic-puzzle': { bg: 'rgba(20,184,166,0.12)', border: 'rgba(20,184,166,0.4)', glow: '#14b8a6' },
    'word-scramble': { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.4)', glow: '#22c55e' },
    'color-match': { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.4)', glow: '#ec4899' },
    'pattern-rec': { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.4)', glow: '#f97316' },
    'typing-speed': { bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.4)', glow: '#06b6d4' },
    'odd-one-out': { bg: 'rgba(132,204,22,0.12)', border: 'rgba(132,204,22,0.4)', glow: '#84cc16' },
};

export default function Lobby() {
    const navigate = useNavigate();
    const socket = useSocket();
    const { profile, room, setRoom, gameList, setCurrentRound } = useGame();
    const { playerData } = useAuth();

    const [selectedGames, setSelectedGames] = useState([]);
    const [timePerRound, setTimePerRound] = useState(30);
    const [betAmount, setBetAmount] = useState(20);
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);

    const pot = betAmount * (room?.players?.length || 1);

    // رابط الانضمام - يشمل كود الغرفة
    const joinUrl = `${window.location.origin}/?join=${room?.code}`;

    const isAdmin = room?.adminId === socket?.id;

    useEffect(() => {
        if (!socket || !room) return;
        socket.on('room:updated', ({ room: r }) => setRoom(r));
        socket.on('game:started', ({ room: r }) => setRoom(r));
        socket.on('game:round_start', (roundData) => {
            setCurrentRound(roundData);
            navigate('/game');
        });
        return () => {
            socket.off('room:updated');
            socket.off('game:started');
            socket.off('game:round_start');
        };
    }, [socket, room]);

    function toggleGame(gameId) {
        if (!isAdmin) return;
        setSelectedGames(prev => {
            if (prev.includes(gameId)) return prev.filter(g => g !== gameId);
            if (prev.length >= 5) return prev;
            return [...prev, gameId];
        });
    }

    function startGame() {
        socket.emit('admin:config', { roomCode: room.code, config: { selectedGames, timePerRound } });
        setTimeout(() => socket.emit('admin:start', { roomCode: room.code }), 100);
    }

    function copyCode() {
        navigator.clipboard.writeText(room.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (!room || !profile) return <div className="page"><p style={{ textAlign: 'center', padding: 40 }}>⏳ جاري التحميل...</p></div>;

    return (
        <div style={{ minHeight: '100vh', padding: '16px', maxWidth: 860, margin: '0 auto' }}>

            {/* ═══ HEADER ═══ */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 20, flexWrap: 'wrap', gap: 10
                }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link to="/profile" style={{ textDecoration: 'none' }}>
                        {profile.avatar ? (
                            <img src={profile.avatar} style={{
                                width: 40, height: 40, borderRadius: '50%',
                                objectFit: 'cover', border: `2px solid ${profile.color || 'var(--primary)'}`
                            }} />
                        ) : (
                            <div style={{
                                width: 40, height: 40, borderRadius: '50%',
                                background: `linear-gradient(135deg, ${profile.color || 'var(--primary)'}, ${profile.color || 'var(--primary)'}80)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 18, fontWeight: 900, color: 'white', border: `2px solid ${profile.color || 'var(--primary)'}`
                            }}>
                                {profile.name?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}
                    </Link>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>{profile.name}</div>
                        <div style={{ fontSize: 12, color: '#fbbf24' }}>🪙 {(playerData?.coins || 0).toLocaleString()}</div>
                    </div>
                </div>

                {/* Room Code + QR */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <motion.div whileTap={{ scale: 0.95 }} onClick={copyCode}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
                            borderRadius: 14, background: 'rgba(167,139,250,0.12)', border: '1.5px solid rgba(167,139,250,0.4)',
                            cursor: 'pointer', userSelect: 'none'
                        }}>
                        <div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>كود الغرفة • اضغط للنسخ</div>
                            <div style={{
                                fontSize: 26, fontWeight: 900, letterSpacing: 6, color: '#c4b5fd',
                                fontVariantNumeric: 'tabular-nums'
                            }}>{room.code}</div>
                        </div>
                        <AnimatePresence mode="wait">
                            {copied
                                ? <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ fontSize: 22 }}>✅</motion.span>
                                : <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ fontSize: 22 }}>📋</motion.span>
                            }
                        </AnimatePresence>
                    </motion.div>
                    {/* QR Button */}
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setShowQR(true)}
                        style={{
                            padding: '12px 14px', borderRadius: 14, border: '1.5px solid rgba(167,139,250,0.4)',
                            background: 'rgba(167,139,250,0.12)', cursor: 'pointer', fontSize: 22
                        }}>📷</motion.button>
                </div>
            </motion.div>

            {/* ═══ QR MODAL ═══ */}
            <AnimatePresence>
                {showQR && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowQR(false)}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                            padding: 20, backdropFilter: 'blur(8px)'
                        }}>
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'var(--card)', borderRadius: 24, padding: 28,
                                maxWidth: 320, width: '100%', textAlign: 'center',
                                border: '1px solid var(--border)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
                            }}>
                            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>📷 امسح للانضمام</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>وجّه كاميرتك نحو الكود</div>
                            <div style={{ background: 'white', padding: 16, borderRadius: 16, display: 'inline-block', marginBottom: 16 }}>
                                <QRCodeSVG value={joinUrl} size={200} level="H"
                                    imageSettings={{ src: '🎮', excavate: true, width: 32, height: 32 }} />
                            </div>
                            <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: 6, color: '#c4b5fd', marginBottom: 4 }}>{room.code}</div>
                            <div style={{
                                fontSize: 12, color: 'var(--text-muted)', marginBottom: 16,
                                wordBreak: 'break-all'
                            }}>{joinUrl}</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={copyCode}>📋 نسخ الرابط</button>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowQR(false)}>✓ إغلاق</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ PLAYERS BAR ═══ */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>👥 اللاعبون ({room.players.length})</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>في انتظار البدء...</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <AnimatePresence>
                        {room.players.map((player) => (
                            <motion.div key={player.id}
                                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '6px 12px', borderRadius: 50,
                                    background: player.id === socket?.id ? `${player.color || 'var(--primary)'}20` : 'var(--surface)',
                                    border: `1.5px solid ${player.id === socket?.id ? (player.color || 'var(--primary)') + '60' : 'var(--border)'}`
                                }}>
                                {player.avatar ? (
                                    <img src={player.avatar} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{
                                        width: 24, height: 24, borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${player.color || 'var(--primary)'}, ${player.color || 'var(--primary)'}80)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 900, color: 'white'
                                    }}>
                                        {player.name?.[0]?.toUpperCase()}
                                    </div>
                                )}
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{player.name}</span>
                                {player.isAdmin && <span style={{ fontSize: 10 }}>👑</span>}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* ═══ GAME SELECTION ═══ */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
                className="card" style={{ marginBottom: 16 }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <h2 style={{ fontSize: 17, fontWeight: 800 }}>🎯 اختر الألعاب</h2>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {isAdmin ? 'اختر من 1 إلى 5 ألعاب بالترتيب' : 'Admin يختار الألعاب'}
                        </p>
                    </div>
                    {isAdmin && (
                        <div style={{ display: 'flex', gap: 4 }}>
                            {[1, 2, 3, 4, 5].map(n => (
                                <div key={n} style={{
                                    width: 28, height: 28, borderRadius: '50%', fontSize: 12, fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: selectedGames.length >= n ? 'var(--primary)' : 'var(--surface)',
                                    border: `2px solid ${selectedGames.length >= n ? 'var(--primary)' : 'var(--border)'}`,
                                    color: selectedGames.length >= n ? 'white' : 'var(--text-muted)',
                                    transition: 'all 0.3s',
                                }}>{n}</div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Games Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {gameList.map((game, idx) => {
                        const isSelected = selectedGames.includes(game.id);
                        const orderNum = selectedGames.indexOf(game.id) + 1;
                        const colors = GAME_COLORS[game.id] || { bg: 'var(--surface)', border: 'var(--border)', glow: 'var(--primary)' };
                        const isDisabled = !isAdmin || (!isSelected && selectedGames.length >= 5);

                        return (
                            <motion.button
                                key={game.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                whileHover={isAdmin && !isDisabled ? { scale: 1.02, y: -2 } : {}}
                                whileTap={isAdmin && !isDisabled ? { scale: 0.97 } : {}}
                                onClick={() => toggleGame(game.id)}
                                disabled={isDisabled}
                                style={{
                                    position: 'relative', padding: '14px 12px',
                                    borderRadius: 14, textAlign: 'right', cursor: isAdmin ? 'pointer' : 'default',
                                    background: isSelected ? colors.bg : 'var(--surface)',
                                    border: `2px solid ${isSelected ? colors.border : 'var(--border)'}`,
                                    boxShadow: isSelected ? `0 0 16px ${colors.glow}30` : 'none',
                                    opacity: isDisabled ? 0.45 : 1,
                                    transition: 'all 0.2s',
                                    fontFamily: 'Cairo',
                                }}>

                                {/* Order badge */}
                                {isSelected && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        style={{
                                            position: 'absolute', top: 8, left: 8,
                                            width: 22, height: 22, borderRadius: '50%',
                                            background: colors.glow, color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 11, fontWeight: 800, boxShadow: `0 0 8px ${colors.glow}`
                                        }}>
                                        {orderNum}
                                    </motion.div>
                                )}

                                {/* Checkmark */}
                                {isSelected && (
                                    <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                                        style={{ position: 'absolute', top: 8, right: 8, fontSize: 14 }}>✓</motion.div>
                                )}

                                <div style={{ fontSize: 32, marginBottom: 6 }}>{game.icon}</div>
                                <div style={{
                                    fontWeight: 700, fontSize: 13,
                                    color: isSelected ? colors.glow : 'var(--text)'
                                }}>{game.name}</div>
                                <div style={{
                                    fontSize: 11, color: 'var(--text-muted)', marginTop: 3,
                                    lineHeight: 1.4
                                }}>{game.description}</div>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* ═══ BET SELECTION ═══ */}
            {isAdmin ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
                    className="card" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>🪙 قيمة الرهان</h3>
                        {betAmount > 0 && (
                            <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>
                                الجائزة: {betAmount * room.players.length} عملة
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                        {BET_OPTIONS.map(opt => (
                            <motion.button key={opt.value}
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                                onClick={() => setBetAmount(opt.value)}
                                style={{
                                    padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                                    fontFamily: 'Cairo', fontWeight: 700, fontSize: 14, textAlign: 'center',
                                    background: betAmount === opt.value
                                        ? `${opt.color}25`
                                        : 'var(--surface)',
                                    border: `2px solid ${betAmount === opt.value ? opt.color : 'var(--border)'}`,
                                    color: betAmount === opt.value ? opt.color : 'var(--text-muted)',
                                    boxShadow: betAmount === opt.value ? `0 0 16px ${opt.color}40` : 'none',
                                    transition: 'all 0.2s',
                                }}>
                                <div style={{ fontSize: 20 }}>{opt.icon}</div>
                                <div style={{ marginTop: 4 }}>{opt.label}{opt.value > 0 ? ' 🪙' : ''}</div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            ) : (
                betAmount > 0 && (
                    <div className="card" style={{
                        marginBottom: 16, textAlign: 'center', padding: '12px 16px',
                        background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)'
                    }}>
                        <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 15 }}>
                            🪙 اللعب على {betAmount} عملة • الجائزة: {pot} عملة
                        </span>
                    </div>
                )
            )}

            {/* ═══ TIME SELECTION (Admin) ═══ */}
            {isAdmin && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="card" style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>⏱️ وقت كل جولة</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                        {TIME_OPTIONS.map(opt => (
                            <motion.button key={opt.value}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                onClick={() => setTimePerRound(opt.value)}
                                style={{
                                    padding: '12px 8px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                    fontFamily: 'Cairo', fontWeight: 700, fontSize: 14, textAlign: 'center',
                                    background: timePerRound === opt.value
                                        ? 'linear-gradient(135deg, var(--primary), #5b21b6)'
                                        : 'var(--surface)',
                                    color: timePerRound === opt.value ? 'white' : 'var(--text-muted)',
                                    border: `2px solid ${timePerRound === opt.value ? 'var(--primary)' : 'var(--border)'}`,
                                    transition: 'all 0.2s',
                                }}>
                                <div>{opt.label}</div>
                                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{opt.desc}</div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* ═══ START BUTTON / WAITING ═══ */}
            {isAdmin ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <motion.button
                        whileHover={selectedGames.length > 0 ? { scale: 1.02 } : {}}
                        whileTap={selectedGames.length > 0 ? { scale: 0.97 } : {}}
                        onClick={startGame}
                        disabled={selectedGames.length === 0}
                        style={{
                            width: '100%', padding: '18px', borderRadius: 16, border: 'none',
                            fontFamily: 'Cairo', fontWeight: 800, fontSize: 18, cursor: selectedGames.length > 0 ? 'pointer' : 'not-allowed',
                            background: selectedGames.length > 0
                                ? 'linear-gradient(135deg, var(--primary), #7c3aed, #5b21b6)'
                                : 'var(--surface)',
                            color: selectedGames.length > 0 ? 'white' : 'var(--text-muted)',
                            boxShadow: selectedGames.length > 0 ? '0 8px 32px rgba(124,58,237,0.4)' : 'none',
                            transition: 'all 0.3s',
                        }}>
                        {selectedGames.length === 0
                            ? '⬆️ اختر لعبة واحدة على الأقل'
                            : betAmount > 0
                                ? `🚀 ابدأ · ${selectedGames.length} ألعاب · الجائزة ${betAmount * room.players.length} 🪙`
                                : `🚀 ابدأ اللعبة · ${selectedGames.length} ألعاب`}
                    </motion.button>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                        style={{ fontSize: 36, display: 'inline-block', marginBottom: 12 }}>⏳</motion.div>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>في انتظار الـ Admin</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>سيبدأ الـ Admin اللعبة قريباً...</p>
                </motion.div>
            )}
        </div>
    );
}
