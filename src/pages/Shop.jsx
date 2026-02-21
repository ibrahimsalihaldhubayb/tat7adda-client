import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const DAILY_FREE = 150; // عملات مجانية يومية

// باقات العملات
const PACKAGES = [
    { id: 'p1', coins: 500, price: 5, label: 'مبتدئ', icon: '💰', color: '#6b7280', glow: '#6b728040', popular: false },
    { id: 'p2', coins: 1200, price: 10, label: 'شعبي', icon: '💎', color: '#3b82f6', glow: '#3b82f640', popular: true },
    { id: 'p3', coins: 2500, price: 20, label: 'متقدم', icon: '🏆', color: '#f59e0b', glow: '#f59e0b40', popular: false },
    { id: 'p4', coins: 6500, price: 50, label: 'محترف', icon: '👑', color: '#8b5cf6', glow: '#8b5cf640', popular: false },
    { id: 'p5', coins: 14000, price: 100, label: 'أسطوري', icon: '⚡', color: '#ef4444', glow: '#ef444440', popular: false },
];

// طرق الدفع
const PAYMENT_METHODS = [
    { id: 'stc', name: 'STC Pay', icon: '📱', color: '#6b21a8', desc: 'دفع فوري' },
    { id: 'mada', name: 'Mada', icon: '💳', color: '#006633', desc: 'بطاقة مدى' },
    { id: 'visa', name: 'Visa/MC', icon: '💳', color: '#1a56db', desc: 'بطاقة ائتمان' },
    { id: 'apple', name: 'Apple Pay', icon: '🍎', color: '#1d1d1f', desc: 'Apple Pay' },
];

export default function Shop() {
    const navigate = useNavigate();
    const { user, playerData, updatePlayerData } = useAuth();

    const [selectedPkg, setSelectedPkg] = useState(null);
    const [selectedPay, setSelectedPay] = useState(null);
    const [step, setStep] = useState('browse'); // browse | payment | processing | success
    const [promoCode, setPromoCode] = useState('');
    const [promoApplied, setPromoApplied] = useState(false);
    const [dailyClaimed, setDailyClaimed] = useState(false);
    const [dailyLoading, setDailyLoading] = useState(false);

    // تحقق من مطالبة اليوم
    useEffect(() => {
        if (!playerData) return;
        const today = new Date().toDateString();
        if (playerData.lastDailyCoins === today) setDailyClaimed(true);
    }, [playerData]);

    async function claimDailyCoins() {
        if (dailyClaimed || dailyLoading || !user) return;
        setDailyLoading(true);
        const today = new Date().toDateString();
        const newCoins = (playerData?.coins || 0) + DAILY_FREE;
        await setDoc(doc(db, 'players', user.uid), { coins: newCoins, lastDailyCoins: today }, { merge: true });
        updatePlayerData(user.uid, { coins: newCoins, lastDailyCoins: today });
        setDailyClaimed(true);
        setDailyLoading(false);
    }

    const pkg = PACKAGES.find(p => p.id === selectedPkg);
    const finalCoins = promoApplied && pkg ? Math.round(pkg.coins * 1.2) : pkg?.coins;

    function applyPromo() {
        if (promoCode.trim().toLowerCase() === 'welcome20') {
            setPromoApplied(true);
        } else {
            alert('كود غير صحيح');
        }
    }

    // محاكاة عملية الدفع
    async function processPayment() {
        setStep('processing');
        await new Promise(r => setTimeout(r, 2200)); // محاكاة

        // أضف العملات للحساب
        const newCoins = (playerData?.coins || 0) + finalCoins;
        await setDoc(doc(db, 'players', user.uid), { coins: newCoins }, { merge: true });
        updatePlayerData(user.uid, { coins: newCoins });

        setStep('success');
    }

    return (
        <div style={{ minHeight: '100vh', padding: '16px', maxWidth: 640, margin: '0 auto' }}>

            {/* Header */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← رجوع</button>
                <h1 className="gradient-text" style={{ fontSize: 22, fontWeight: 900 }}>🛒 متجر العملات</h1>
                <div style={{
                    padding: '6px 12px', borderRadius: 20, background: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.3)', fontSize: 14, fontWeight: 700, color: '#fbbf24'
                }}>
                    🪙 {(playerData?.coins || 0).toLocaleString()}
                </div>
            </motion.div>

            {/* ═══ BROWSE STEP ═══ */}
            {step === 'browse' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                    {/* ═══ FREE DAILY COINS ═══ */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            marginBottom: 16, padding: '16px 18px', borderRadius: 18,
                            background: dailyClaimed
                                ? 'rgba(100,116,139,0.08)'
                                : 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.08))',
                            border: `1px solid ${dailyClaimed ? 'var(--border)' : 'rgba(34,197,94,0.35)'}`,
                            display: 'flex', alignItems: 'center', gap: 14,
                        }}>
                        <motion.div
                            animate={dailyClaimed ? {} : { rotate: [0, 15, -15, 0] }}
                            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                            style={{ fontSize: 36, flexShrink: 0 }}
                        >
                            {dailyClaimed ? '✅' : '🎁'}
                        </motion.div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>
                                {dailyClaimed ? 'جمعت عملاتك اليوم' : '🪙 عملاتك المجانية اليومية'}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {dailyClaimed ? 'تعود غداً للمزيد!' : `${DAILY_FREE} عملة مجانية كل يوم — دون شراء`}
                            </div>
                        </div>
                        <motion.button
                            whileHover={dailyClaimed ? {} : { scale: 1.05 }}
                            whileTap={dailyClaimed ? {} : { scale: 0.95 }}
                            onClick={claimDailyCoins}
                            disabled={dailyClaimed || dailyLoading}
                            style={{
                                padding: '10px 16px', borderRadius: 12, border: 'none',
                                cursor: dailyClaimed ? 'default' : 'pointer',
                                fontFamily: 'Cairo', fontWeight: 800, fontSize: 14,
                                background: dailyClaimed ? 'var(--surface)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                                color: dailyClaimed ? 'var(--text-muted)' : 'white',
                                whiteSpace: 'nowrap',
                                boxShadow: dailyClaimed ? 'none' : '0 4px 16px rgba(34,197,94,0.35)',
                            }}
                        >
                            {dailyLoading ? '⏳' : dailyClaimed ? 'تم ✓' : 'اجمع!'}
                        </motion.button>
                    </motion.div>

                    {/* Banner */}
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                        style={{
                            padding: '20px 24px', borderRadius: 20, marginBottom: 20, textAlign: 'center',
                            background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.2))',
                            border: '1px solid rgba(124,58,237,0.3)', position: 'relative', overflow: 'hidden'
                        }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(124,58,237,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(59,130,246,0.2) 0%, transparent 50%)'
                        }} />
                        <div style={{ fontSize: 40, marginBottom: 8 }}>🎁</div>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>أضف كود الخصم</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>احصل على عملات إضافية</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
                            <input
                                value={promoCode}
                                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                placeholder="مثال: WELCOME20"
                                style={{
                                    padding: '10px 16px', borderRadius: 12, border: promoApplied ? '2px solid #10b981' : '2px solid var(--border)',
                                    background: 'var(--surface)', color: 'var(--text)', fontFamily: 'Cairo',
                                    fontSize: 14, textAlign: 'center', width: 160
                                }} />
                            <motion.button whileTap={{ scale: 0.95 }}
                                onClick={applyPromo}
                                disabled={promoApplied}
                                style={{
                                    padding: '10px 18px', borderRadius: 12, border: 'none', cursor: promoApplied ? 'default' : 'pointer',
                                    fontFamily: 'Cairo', fontWeight: 700, fontSize: 14,
                                    background: promoApplied ? '#10b981' : 'var(--primary)', color: 'white'
                                }}>
                                {promoApplied ? '✅ مفعّل' : 'تطبيق'}
                            </motion.button>
                        </div>
                        {promoApplied && (
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                style={{ marginTop: 8, color: '#10b981', fontWeight: 700, fontSize: 13 }}>
                                🎉 مبروك! ستحصل على +20% عملات إضافية
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Packages */}
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>اختر الباقة</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                        {PACKAGES.map((p, i) => {
                            const isSelected = selectedPkg === p.id;
                            const displayCoins = promoApplied ? Math.round(p.coins * 1.2) : p.coins;
                            return (
                                <motion.button key={p.id}
                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                    whileHover={{ scale: 1.01, x: 4 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedPkg(p.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        padding: '14px 18px', borderRadius: 16, border: 'none', cursor: 'pointer',
                                        textAlign: 'right', fontFamily: 'Cairo', position: 'relative', overflow: 'hidden',
                                        background: isSelected ? `linear-gradient(135deg, ${p.glow}, ${p.color}15)` : 'var(--surface)',
                                        border: `2px solid ${isSelected ? p.color : 'var(--border)'}`,
                                        boxShadow: isSelected ? `0 0 20px ${p.glow}` : 'none',
                                        transition: 'all 0.2s',
                                    }}>

                                    {p.popular && (
                                        <div style={{
                                            position: 'absolute', top: 0, left: 0, background: '#3b82f6',
                                            color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 10px',
                                            borderRadius: '0 0 8px 0'
                                        }}>⭐ الأكثر شعبية</div>
                                    )}

                                    <div style={{ fontSize: 36 }}>{p.icon}</div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 800, fontSize: 16, color: isSelected ? p.color : 'var(--text)' }}>
                                            {displayCoins.toLocaleString()} 🪙
                                        </div>
                                        {promoApplied && (
                                            <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                                                +{Math.round(p.coins * 0.2).toLocaleString()} مجاني!
                                            </div>
                                        )}
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{p.label}</div>
                                    </div>

                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: isSelected ? p.color : 'var(--text)' }}>
                                            ${p.price}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(p.price * 3.75)} ريال</div>
                                    </div>

                                    {isSelected && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            style={{ fontSize: 20, color: p.color }}>✓</motion.div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    <motion.button
                        whileHover={selectedPkg ? { scale: 1.02 } : {}} whileTap={selectedPkg ? { scale: 0.97 } : {}}
                        disabled={!selectedPkg}
                        onClick={() => setStep('payment')}
                        style={{
                            width: '100%', padding: 18, borderRadius: 16, border: 'none', cursor: selectedPkg ? 'pointer' : 'not-allowed',
                            fontFamily: 'Cairo', fontWeight: 800, fontSize: 17,
                            background: selectedPkg ? 'linear-gradient(135deg, var(--primary), #5b21b6)' : 'var(--surface)',
                            color: selectedPkg ? 'white' : 'var(--text-muted)',
                            boxShadow: selectedPkg ? '0 8px 24px rgba(124,58,237,0.35)' : 'none',
                            transition: 'all 0.3s'
                        }}>
                        {selectedPkg ? `🛒 تابع للدفع · ${finalCoins?.toLocaleString()} 🪙` : 'اختر باقة أولاً'}
                    </motion.button>
                </motion.div>
            )}

            {/* ═══ PAYMENT STEP ═══ */}
            {step === 'payment' && pkg && (
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>

                    {/* Order Summary */}
                    <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
                        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>📋 ملخص الطلب</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 32 }}>{pkg.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 700 }}>{finalCoins?.toLocaleString()} عملة</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>باقة {pkg.label}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 22, fontWeight: 900, color: pkg.color }}>${pkg.price}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{Math.round(pkg.price * 3.75)} ريال</div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>💳 طريقة الدفع</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                        {PAYMENT_METHODS.map(m => (
                            <motion.button key={m.id}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                onClick={() => setSelectedPay(m.id)}
                                style={{
                                    padding: '16px 12px', borderRadius: 14, border: 'none', cursor: 'pointer',
                                    fontFamily: 'Cairo', textAlign: 'center',
                                    background: selectedPay === m.id ? `${m.color}20` : 'var(--surface)',
                                    border: `2px solid ${selectedPay === m.id ? m.color : 'var(--border)'}`,
                                    transition: 'all 0.2s'
                                }}>
                                <div style={{ fontSize: 28, marginBottom: 6 }}>{m.icon}</div>
                                <div style={{
                                    fontWeight: 700, fontSize: 13,
                                    color: selectedPay === m.id ? m.color : 'var(--text)'
                                }}>{m.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.desc}</div>
                            </motion.button>
                        ))}
                    </div>

                    {/* Security notice */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                        borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                        marginBottom: 16, fontSize: 12, color: 'var(--text-muted)'
                    }}>
                        <span style={{ fontSize: 18 }}>🔒</span>
                        <span>جميع معاملاتك مشفرة وآمنة تماماً</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                        <button className="btn btn-secondary btn-lg" onClick={() => setStep('browse')}>← رجوع</button>
                        <motion.button
                            whileHover={selectedPay ? { scale: 1.02 } : {}} whileTap={selectedPay ? { scale: 0.97 } : {}}
                            disabled={!selectedPay}
                            onClick={processPayment}
                            style={{
                                padding: 16, borderRadius: 14, border: 'none', cursor: selectedPay ? 'pointer' : 'not-allowed',
                                fontFamily: 'Cairo', fontWeight: 800, fontSize: 15,
                                background: selectedPay ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--surface)',
                                color: selectedPay ? 'white' : 'var(--text-muted)',
                                boxShadow: selectedPay ? '0 8px 24px rgba(16,185,129,0.35)' : 'none',
                                transition: 'all 0.3s'
                            }}>
                            ✅ تأكيد الدفع · {Math.round((pkg.price || 0) * 3.75)} ريال
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {/* ═══ PROCESSING ═══ */}
            {step === 'processing' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        style={{ fontSize: 60, display: 'inline-block', marginBottom: 20 }}>⚙️</motion.div>
                    <h2 style={{ fontWeight: 800, fontSize: 20 }}>جاري معالجة الدفع...</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>الرجاء الانتظار</p>
                </motion.div>
            )}

            {/* ═══ SUCCESS ═══ */}
            {step === 'success' && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: 2, duration: 0.5 }}
                        style={{ fontSize: 80, marginBottom: 16 }}>🎉</motion.div>
                    <h1 className="gradient-text" style={{ fontSize: 28, fontWeight: 900 }}>تم الشحن!</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 16 }}>
                        تمت إضافة <strong style={{ color: '#fbbf24' }}>{finalCoins?.toLocaleString()} 🪙</strong> لحسابك
                    </p>
                    <div style={{
                        margin: '20px auto', padding: '16px 24px', borderRadius: 16, display: 'inline-block',
                        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)'
                    }}>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>رصيدك الحالي</div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: '#fbbf24', marginTop: 4 }}>
                            🪙 {(playerData?.coins || 0).toLocaleString()}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
                        <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>🎮 العب الآن</button>
                        <button className="btn btn-secondary btn-lg" onClick={() => { setStep('browse'); setSelectedPkg(null); setSelectedPay(null); }}>
                            🛒 شحن مرة أخرى
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
