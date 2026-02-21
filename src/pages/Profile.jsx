import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, calcLevel, getFrame } from '../context/AuthContext';

export default function Profile() {
    const navigate = useNavigate();
    const { user, playerData, logout, updatePlayerData } = useAuth();
    const [tab, setTab] = useState('stats'); // stats | following | leaderboard
    const [leaderboard, setLeaderboard] = useState([]);
    const [loadingLB, setLoadingLB] = useState(false);

    useEffect(() => {
        if (!user) navigate('/auth');
    }, [user]);

    useEffect(() => {
        if (tab === 'leaderboard') loadLeaderboard();
    }, [tab]);

    async function loadLeaderboard() {
        setLoadingLB(true);
        const q = query(collection(db, 'players'), orderBy('coins', 'desc'), limit(20));
        const snap = await getDocs(q);
        setLeaderboard(snap.docs.map(d => d.data()));
        setLoadingLB(false);
    }

    if (!playerData) return <div className="page"><p>جاري التحميل...</p></div>;

    const { level, xpInLevel, xpNeeded } = calcLevel(playerData.xp || 0);
    const frame = getFrame(level);
    const xpPercent = Math.round((xpInLevel / xpNeeded) * 100);

    return (
        <div style={{ minHeight: '100vh', padding: '16px', maxWidth: 600, margin: '0 auto' }}>
            {/* Header */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')}>← رجوع</button>
                <h1 className="gradient-text" style={{ fontSize: 22, fontWeight: 900 }}>ملفي الشخصي</h1>
                <button className="btn btn-sm"
                    style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)' }}
                    onClick={logout}>خروج</button>
            </motion.div>

            {/* Profile Card */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="card" style={{ marginBottom: 16, padding: 24, textAlign: 'center' }}>

                {/* Avatar with frame */}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                    {playerData.avatarUrl ? (
                        <img src={playerData.avatarUrl} alt={playerData.name}
                            style={{
                                width: 90, height: 90, borderRadius: '50%', objectFit: 'cover',
                                border: `4px solid ${frame.color}`,
                                boxShadow: `0 0 20px ${frame.glow}, 0 0 40px ${frame.glow}`
                            }} />
                    ) : (
                        <div style={{
                            width: 90, height: 90, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${playerData.color || 'var(--primary)'}, ${playerData.color || 'var(--primary)'}80)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 36, fontWeight: 900, color: 'white',
                            border: `4px solid ${frame.color}`,
                            boxShadow: `0 0 20px ${frame.glow}`,
                        }}>
                            {playerData.name?.[0]?.toUpperCase() || '?'}
                        </div>
                    )}
                    {/* Frame badge */}
                    <div style={{
                        position: 'absolute', bottom: 0, right: 0,
                        background: frame.color, borderRadius: '50%',
                        width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, border: '2px solid var(--bg)',
                    }}>{frame.icon}</div>
                </div>

                <h2 style={{ fontSize: 22, fontWeight: 900 }}>{playerData.name}</h2>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 6 }}>
                    <span className="badge badge-primary">المستوى {level}</span>
                    <span style={{
                        padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                        background: `${frame.color}20`, color: frame.color, border: `1px solid ${frame.color}40`
                    }}>
                        {frame.icon} {frame.label}
                    </span>
                </div>

                {/* XP bar */}
                <div style={{ marginTop: 14 }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', fontSize: 12,
                        color: 'var(--text-muted)', marginBottom: 6
                    }}>
                        <span>XP: {playerData.xp || 0}</span>
                        <span>{xpInLevel} / {xpNeeded} للمستوى التالي</span>
                    </div>
                    <div className="progress-bar">
                        <motion.div className="progress-fill"
                            initial={{ width: 0 }} animate={{ width: `${xpPercent}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{ background: `linear-gradient(90deg, ${frame.color}, ${frame.color}aa)` }} />
                    </div>
                </div>

                {/* Coins + شحن */}
                <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <div style={{
                        padding: '12px 20px', borderRadius: 12,
                        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                        display: 'inline-flex', alignItems: 'center', gap: 8
                    }}>
                        <span style={{ fontSize: 24 }}>🪙</span>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24' }}>
                                {(playerData.coins || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>عملة</div>
                        </div>
                    </div>
                    <Link to="/shop" style={{ textDecoration: 'none' }}>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            style={{
                                padding: '12px 20px', borderRadius: 12, cursor: 'pointer',
                                background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))',
                                border: '1px solid rgba(16,185,129,0.4)',
                                display: 'inline-flex', alignItems: 'center', gap: 8
                            }}>
                            <span style={{ fontSize: 22 }}>💳</span>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>شحن عملات</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>اشتري المزيد</div>
                            </div>
                        </motion.div>
                    </Link>
                </div>
            </motion.div>

            {/* Tabs */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4,
                background: 'var(--surface2)', borderRadius: 10, padding: 4, marginBottom: 16
            }}>
                {[
                    { id: 'stats', label: '📊 إحصاءات' },
                    { id: 'following', label: '👥 أتابعهم' },
                    { id: 'leaderboard', label: '🏆 ترتيب' },
                ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        padding: '10px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        fontFamily: 'Cairo', fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                        background: tab === t.id ? 'linear-gradient(135deg,var(--primary),#5b21b6)' : 'transparent',
                        color: tab === t.id ? 'white' : 'var(--text-muted)',
                    }}>{t.label}</button>
                ))}
            </div>

            {/* Stats Tab */}
            {tab === 'stats' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                        { label: 'مباريات', value: playerData.totalMatches || 0, icon: '🎮' },
                        { label: 'مرات أول', value: playerData.firstPlaceCount || 0, icon: '🥇' },
                        { label: 'مرات ثاني', value: playerData.secondPlaceCount || 0, icon: '🥈' },
                        { label: 'مرات ثالث', value: playerData.thirdPlaceCount || 0, icon: '🥉' },
                        { label: 'نقاط كلية', value: (playerData.totalScore || 0).toLocaleString(), icon: '⭐' },
                        {
                            label: 'معدل الفوز', value: playerData.totalMatches > 0
                                ? `${Math.round((playerData.firstPlaceCount / playerData.totalMatches) * 100)}%` : '0%', icon: '📈'
                        },
                    ].map((stat, i) => (
                        <motion.div key={i} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                            <div style={{ fontSize: 28 }}>{stat.icon}</div>
                            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{stat.value}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Following Tab */}
            {tab === 'following' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {(!playerData.following || playerData.following.length === 0) ? (
                        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>👥</div>
                            <p style={{ color: 'var(--text-muted)' }}>لا تتابع أحداً بعد</p>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                                ابحث في قائمة المتصدرين لمتابعة لاعبين
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {playerData.following.map((uid, i) => (
                                <PlayerCard key={uid} uid={uid} currentUser={user} updatePlayerData={updatePlayerData} playerData={playerData} />
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Leaderboard Tab */}
            {tab === 'leaderboard' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="card">
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>
                            🪙 أغنى 20 لاعب عالمياً
                        </h3>
                        {loadingLB ? (
                            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>⏳ جاري التحميل...</div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {leaderboard.map((p, i) => {
                                    const pLevel = calcLevel(p.xp || 0).level;
                                    const pFrame = getFrame(pLevel);
                                    const isMe = p.uid === user?.uid;
                                    const isFollowing = playerData.following?.includes(p.uid);
                                    return (
                                        <div key={p.uid} style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '10px 12px', borderRadius: 10,
                                            background: isMe ? 'rgba(124,58,237,0.15)' : 'var(--surface)',
                                            border: isMe ? '1px solid rgba(124,58,237,0.3)' : '1px solid var(--border)',
                                        }}>
                                            <div style={{ fontSize: i < 3 ? 22 : 15, fontWeight: 700, minWidth: 30, textAlign: 'center' }}>
                                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                                            </div>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                                background: p.avatarUrl ? 'transparent' : `linear-gradient(135deg, ${p.color || '#7c3aed'}, ${p.color || '#7c3aed'}80)`,
                                                border: `2px solid ${pFrame.color}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 16, fontWeight: 900, color: 'white', overflow: 'hidden',
                                            }}>
                                                {p.avatarUrl ? <img src={p.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name} {isMe && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(أنت)</span>}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lv.{pLevel} {pFrame.icon} | <span style={{ color: '#fbbf24', fontWeight: 700 }}>🪙 {(p.coins || 0).toLocaleString()}</span></div>
                                            </div>
                                            {!isMe && (
                                                <button
                                                    onClick={async () => {
                                                        const ref = doc(db, 'players', user.uid);
                                                        if (isFollowing) {
                                                            await updateDoc(ref, { following: arrayRemove(p.uid) });
                                                            updatePlayerData(user.uid, { following: (playerData.following || []).filter(f => f !== p.uid) });
                                                        } else {
                                                            await updateDoc(ref, { following: arrayUnion(p.uid) });
                                                            updatePlayerData(user.uid, { following: [...(playerData.following || []), p.uid] });
                                                        }
                                                    }}
                                                    className="btn btn-sm"
                                                    style={{
                                                        background: isFollowing ? 'rgba(239,68,68,0.15)' : 'rgba(124,58,237,0.15)',
                                                        color: isFollowing ? 'var(--danger)' : 'var(--primary)',
                                                        border: `1px solid ${isFollowing ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.3)'}`,
                                                        fontSize: 12,
                                                    }}>
                                                    {isFollowing ? '❌ إلغاء' : '➕ تابع'}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// Placeholder component - in a full app you'd load player details from Firestore
function PlayerCard({ uid, currentUser, updatePlayerData, playerData }) {
    return (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'white' }}>👤</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>لاعب</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{uid.slice(0, 8)}...</div>
            </div>
            <button className="btn btn-sm"
                style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 12 }}
                onClick={async () => {
                    const ref = doc(db, 'players', currentUser.uid);
                    await updateDoc(ref, { following: arrayRemove(uid) });
                    updatePlayerData(currentUser.uid, { following: (playerData.following || []).filter(f => f !== uid) });
                }}>
                ❌ إلغاء
            </button>
        </div>
    );
}
