import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useGame } from '../context/GameContext';
import { useAuth, calcMatchXP, calcLevel, getFrame } from '../context/AuthContext';

const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = ['#fbbf24', '#94a3b8', '#cd7c2f'];

export default function Results() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { profile } = useGame();
    const { user, playerData, updatePlayerData } = useAuth();
    const saved = useRef(false);

    const players = state?.players || [];
    const myRank = players.findIndex(p => p.name === profile?.name);
    const myPlayer = players[myRank];

    // حفظ نتيجة المباراة في Firebase مرة واحدة
    useEffect(() => {
        if (saved.current || !user || !playerData || myRank < 0 || !myPlayer) return;
        saved.current = true;

        const xpGained = calcMatchXP(myRank + 1, players.length, myPlayer.score || 0);
        const coinsGained = myRank === 0 ? 200 : myRank === 1 ? 100 : myRank === 2 ? 50 : 20;

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
    const coinsGained = myRank === 0 ? 200 : myRank === 1 ? 100 : myRank === 2 ? 50 : 20;
    const oldLevel = playerData ? calcLevel(playerData.xp || 0).level : 1;
    const newLevel = playerData ? calcLevel((playerData.xp || 0) + xpGained).level : 1;
    const leveledUp = newLevel > oldLevel;
    const frame = getFrame(newLevel);

    return (
        <div className="page">
            <div className="page-content" style={{ maxWidth: 560 }}>
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>

                    {/* Winner banner */}
                    {players[0] && (
                        <div className="text-center" style={{ marginBottom: 24 }}>
                            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
                                style={{ fontSize: 72 }}>🏆</motion.div>
                            <h1 className="title gradient-text" style={{ marginTop: 8 }}>{players[0].name} فاز!</h1>
                            <p className="subtitle">بـ {players[0].score} نقطة</p>
                        </div>
                    )}

                    {/* Level up */}
                    {leveledUp && (
                        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5, type: 'spring' }}
                            style={{
                                padding: 16, borderRadius: 14, marginBottom: 16, textAlign: 'center',
                                background: `linear-gradient(135deg, ${frame.color}30, ${frame.color}10)`,
                                border: `2px solid ${frame.color}`, boxShadow: `0 0 20px ${frame.glow}`
                            }}>
                            <div style={{ fontSize: 32 }}>🎊</div>
                            <div style={{ fontWeight: 900, fontSize: 18, marginTop: 4 }}>ترقّيت للمستوى {newLevel}!</div>
                            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>{frame.icon} {frame.label}</div>
                        </motion.div>
                    )}

                    {/* XP + Coins gained */}
                    {xpGained > 0 && (
                        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
                            <span style={{
                                padding: '6px 14px', borderRadius: 999, background: 'rgba(124,58,237,0.15)',
                                border: '1px solid rgba(124,58,237,0.3)', fontSize: 14, fontWeight: 700
                            }}>
                                +{xpGained} XP ⭐
                            </span>
                            <span style={{
                                padding: '6px 14px', borderRadius: 999, background: 'rgba(245,158,11,0.15)',
                                border: '1px solid rgba(245,158,11,0.3)', fontSize: 14, fontWeight: 700, color: '#fbbf24'
                            }}>
                                +{coinsGained} 🪙
                            </span>
                        </motion.div>
                    )}

                    {/* Leaderboard */}
                    <div className="card card-lg">
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>
                            🏅 الترتيب النهائي
                        </h2>
                        <div className="flex flex-col gap-3">
                            {players.map((player, i) => (
                                <motion.div key={player.id || i}
                                    initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '12px 14px', borderRadius: 12,
                                        background: i === 0 ? 'rgba(245,158,11,0.1)' :
                                            i === 1 ? 'rgba(148,163,184,0.1)' :
                                                i === 2 ? 'rgba(205,124,47,0.1)' : 'var(--surface)',
                                        border: `1px solid ${i < 3 ? RANK_COLORS[i] + '40' : 'var(--border)'}`,
                                    }}>
                                    <div style={{ fontSize: 28, minWidth: 36, textAlign: 'center' }}>
                                        {MEDALS[i] || `${i + 1}`}
                                    </div>
                                    {player.avatar ? (
                                        <img src={player.avatar} alt={player.name}
                                            style={{
                                                width: 40, height: 40, borderRadius: '50%', objectFit: 'cover',
                                                border: `2px solid ${player.color || 'var(--primary)'}`
                                            }} />
                                    ) : (
                                        <div style={{
                                            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                                            background: `linear-gradient(135deg, ${player.color || 'var(--primary)'}, ${player.color || 'var(--primary)'}80)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 18, fontWeight: 900, color: 'white',
                                        }}>
                                            {player.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 15 }}>
                                            {player.name}
                                            {player.name === profile?.name && (
                                                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> (أنت)</span>
                                            )}
                                        </div>
                                        <div className="coin" style={{ fontSize: 13 }}>🪙 {player.coins}</div>
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: i < 3 ? RANK_COLORS[i] : 'var(--text)' }}>
                                            {player.score}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>نقطة</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {myRank >= 0 && (
                            <div style={{
                                marginTop: 16, padding: '12px 16px', borderRadius: 10,
                                background: 'var(--surface2)', textAlign: 'center', border: '1px solid var(--border)'
                            }}>
                                {myRank === 0 ? '🎉 أنت الفائز! مبروك!' :
                                    myRank === 1 ? '😊 المركز الثاني، أحسنت!' :
                                        myRank === 2 ? '👏 المركز الثالث، جيد!' :
                                            `جاهدت في المركز ${myRank + 1}، حاول مرة أخرى!`}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
                            <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>
                                🔄 لعبة جديدة
                            </button>
                            <Link to="/profile" className="btn btn-secondary btn-lg"
                                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                👤 ملفي
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
