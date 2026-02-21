import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const DAILY_COINS = 100;      // عملات مجانية كل 24 ساعة
const AD_COINS = 30;       // عملات مشاهدة إعلان
const AD_COOLDOWN = 30 * 60;  // 30 دقيقة بين كل إعلان (بالثواني)

function formatTime(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}س ${m}د`;
    if (m > 0) return `${m}د ${s}ث`;
    return `${s}ث`;
}

export default function Shop() {
    const navigate = useNavigate();
    const { user, playerData, updatePlayerData } = useAuth();

    // ─── حالة المطالبة اليومية ────────────────────
    const [dailyLeft, setDailyLeft] = useState(0);       // ثواني متبقية
    const [dailyLoading, setDailyLoading] = useState(false);
    const [dailyDone, setDailyDone] = useState(false);

    // ─── حالة الإعلان ────────────────────────────
    const [adLeft, setAdLeft] = useState(0);             // ثواني متبقية
    const [adWatching, setAdWatching] = useState(false); // يشاهد الآن
    const [adProgress, setAdProgress] = useState(0);    // 0-100
    const [adDone, setAdDone] = useState(false);
    const adRef = { timer: null };

    // ─── حساب الوقت المتبقي للمطالبة اليومية ────
    useEffect(() => {
        if (!playerData) return;
        const last = playerData.lastDailyClaim || 0;
        const now = Date.now();
        const diff = 24 * 3600 * 1000 - (now - last);
        if (diff > 0) {
            setDailyLeft(Math.ceil(diff / 1000));
            setDailyDone(true);
        } else {
            setDailyLeft(0);
            setDailyDone(false);
        }

        const lastAd = playerData.lastAdClaim || 0;
        const adDiff = AD_COOLDOWN * 1000 - (now - lastAd);
        if (adDiff > 0) setAdLeft(Math.ceil(adDiff / 1000));
    }, [playerData]);

    // ─── عداد تنازلي للمطالبة اليومية ───────────
    useEffect(() => {
        if (dailyLeft <= 0) return;
        const t = setInterval(() => setDailyLeft(p => {
            if (p <= 1) { setDailyDone(false); clearInterval(t); return 0; }
            return p - 1;
        }), 1000);
        return () => clearInterval(t);
    }, [dailyLeft]);

    // ─── عداد تنازلي للإعلان ─────────────────────
    useEffect(() => {
        if (adLeft <= 0) return;
        const t = setInterval(() => setAdLeft(p => {
            if (p <= 1) { clearInterval(t); return 0; }
            return p - 1;
        }), 1000);
        return () => clearInterval(t);
    }, [adLeft]);

    // ─── مطالبة يومية ────────────────────────────
    async function claimDaily() {
        if (dailyDone || dailyLoading || !user) return;
        setDailyLoading(true);
        const newCoins = (playerData?.coins || 0) + DAILY_COINS;
        const now = Date.now();
        await setDoc(doc(db, 'players', user.uid), { coins: newCoins, lastDailyClaim: now }, { merge: true });
        updatePlayerData(user.uid, { coins: newCoins, lastDailyClaim: now });
        setDailyDone(true);
        setDailyLeft(24 * 3600);
        setDailyLoading(false);
    }

    // ─── مشاهدة إعلان ────────────────────────────
    function watchAd() {
        if (adLeft > 0 || adWatching || !user) return;
        setAdWatching(true);
        setAdProgress(0);
        let elapsed = 0;
        const AD_DURATION = 5; // 5 ثواني محاكاة
        const t = setInterval(async () => {
            elapsed++;
            setAdProgress(Math.round((elapsed / AD_DURATION) * 100));
            if (elapsed >= AD_DURATION) {
                clearInterval(t);
                setAdWatching(false);
                setAdProgress(100);
                // أضف العملات
                const newCoins = (playerData?.coins || 0) + AD_COINS;
                const now = Date.now();
                await setDoc(doc(db, 'players', user.uid), { coins: newCoins, lastAdClaim: now }, { merge: true });
                updatePlayerData(user.uid, { coins: newCoins, lastAdClaim: now });
                setAdLeft(AD_COOLDOWN);
                setTimeout(() => setAdProgress(0), 1500);
            }
        }, 1000);
    }

    const canClaimDaily = !dailyDone && !dailyLoading;
    const canWatchAd = adLeft === 0 && !adWatching;

    return (
        <div style={{ minHeight: '100vh', padding: '16px', maxWidth: 560, margin: '0 auto' }}>

            {/* Header */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← رجوع</button>
                <h1 style={{
                    fontSize: 20, fontWeight: 900,
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>🪙 عملاتك</h1>
                <div style={{
                    padding: '6px 14px', borderRadius: 20,
                    background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
                    fontSize: 15, fontWeight: 800, color: '#fbbf24',
                }}>
                    {(playerData?.coins || 0).toLocaleString()} 🪙
                </div>
            </motion.div>

            {/* ═══ بطاقة المطالبة اليومية ═══ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                style={{
                    marginBottom: 14, padding: '20px 20px', borderRadius: 20,
                    background: canClaimDaily
                        ? 'linear-gradient(135deg, rgba(34,197,94,0.14), rgba(16,185,129,0.07))'
                        : 'var(--glass)',
                    border: `1.5px solid ${canClaimDaily ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', gap: 14,
                }}
            >
                <motion.div
                    animate={canClaimDaily ? { rotate: [0, 14, -14, 0] } : {}}
                    transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
                    style={{ fontSize: 42, flexShrink: 0 }}
                >
                    {dailyDone ? (canClaimDaily ? '🎁' : '✅') : '🎁'}
                </motion.div>

                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 3 }}>
                        {dailyDone ? 'تم الاستلام 👏' : '100 عملة مجانية'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {dailyDone
                            ? `تعود بعد: ${formatTime(dailyLeft)}`
                            : 'تُجدَّد كل 24 ساعة بالضبط — بدون شراء'}
                    </div>
                    {dailyDone && dailyLeft > 0 && (
                        <div style={{ marginTop: 6 }}>
                            <div style={{ height: 4, borderRadius: 4, background: 'var(--surface2)', overflow: 'hidden' }}>
                                <motion.div
                                    style={{ height: '100%', borderRadius: 4, background: '#22c55e' }}
                                    animate={{ width: `${100 - (dailyLeft / (24 * 3600)) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <motion.button
                    whileHover={canClaimDaily ? { scale: 1.06 } : {}}
                    whileTap={canClaimDaily ? { scale: 0.94 } : {}}
                    onClick={claimDaily}
                    disabled={!canClaimDaily}
                    style={{
                        padding: '12px 18px', borderRadius: 14, border: 'none', flexShrink: 0,
                        cursor: canClaimDaily ? 'pointer' : 'default',
                        fontFamily: 'Cairo', fontWeight: 800, fontSize: 15,
                        background: canClaimDaily
                            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                            : 'var(--surface)',
                        color: canClaimDaily ? 'white' : 'var(--text-muted)',
                        boxShadow: canClaimDaily ? '0 6px 20px rgba(34,197,94,0.35)' : 'none',
                        transition: 'all 0.25s',
                    }}
                >
                    {dailyLoading ? '⏳' : dailyDone ? 'لاحقاً' : 'اجمع!'}
                </motion.button>
            </motion.div>

            {/* ═══ بطاقة مشاهدة الإعلان ═══ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                style={{
                    marginBottom: 14, padding: '20px 20px', borderRadius: 20,
                    background: canWatchAd
                        ? 'linear-gradient(135deg, rgba(59,130,246,0.14), rgba(99,102,241,0.07))'
                        : 'var(--glass)',
                    border: `1.5px solid ${canWatchAd ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', gap: 14,
                }}
            >
                <motion.div
                    animate={adWatching ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    style={{ fontSize: 42, flexShrink: 0 }}
                >
                    {adWatching ? '📺' : canWatchAd ? '🎬' : '🎬'}
                </motion.div>

                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 3 }}>
                        {adWatching ? 'شاهد الإعلان...' : `اكسب ${AD_COINS} عملة`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: adWatching ? 6 : 0 }}>
                        {adLeft > 0
                            ? `متاح بعد: ${formatTime(adLeft)}`
                            : adWatching
                                ? 'لا تغلق الصفحة...'
                                : 'شاهد إعلاناً قصيراً واكسب عملات'}
                    </div>
                    {/* شريط تقدم الإعلان */}
                    {adWatching && (
                        <div style={{ height: 5, borderRadius: 4, background: 'var(--surface2)', overflow: 'hidden' }}>
                            <motion.div
                                style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }}
                                animate={{ width: `${adProgress}%` }}
                                transition={{ duration: 0.4 }}
                            />
                        </div>
                    )}
                    {adProgress === 100 && !adWatching && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ fontSize: 13, color: '#22c55e', fontWeight: 700, marginTop: 2 }}
                        >
                            ✅ +{AD_COINS} عملة تمت الإضافة!
                        </motion.div>
                    )}
                </div>

                <motion.button
                    whileHover={canWatchAd ? { scale: 1.06 } : {}}
                    whileTap={canWatchAd ? { scale: 0.94 } : {}}
                    onClick={watchAd}
                    disabled={!canWatchAd}
                    style={{
                        padding: '12px 18px', borderRadius: 14, border: 'none', flexShrink: 0,
                        cursor: canWatchAd ? 'pointer' : 'default',
                        fontFamily: 'Cairo', fontWeight: 800, fontSize: 15,
                        background: canWatchAd
                            ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                            : 'var(--surface)',
                        color: canWatchAd ? 'white' : 'var(--text-muted)',
                        boxShadow: canWatchAd ? '0 6px 20px rgba(59,130,246,0.35)' : 'none',
                        transition: 'all 0.25s',
                    }}
                >
                    {adWatching ? `${adProgress}%` : adLeft > 0 ? formatTime(adLeft) : 'شاهد'}
                </motion.button>
            </motion.div>

            {/* ═══ إشعار الباقات المدفوعة ═══ */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                style={{
                    padding: '14px 18px', borderRadius: 16, textAlign: 'center',
                    background: 'var(--glass)', border: '1px solid var(--border)',
                    color: 'var(--text-muted)', fontSize: 13,
                }}
            >
                🔒 باقات الشحن قادمة قريباً...
            </motion.div>

        </div>
    );
}
