import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#ec4899', '#f97316', '#8b5cf6'];

export default function AuthPage() {
    const navigate = useNavigate();
    const { registerWithEmail, loginWithEmail, loginWithGoogle } = useAuth();

    const [mode, setMode] = useState('login'); // login | register
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedColor, setSelectedColor] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        setError('');
        setLoading(true);
        try {
            if (mode === 'register') {
                if (!name.trim()) { setError('أدخل اسمك'); setLoading(false); return; }
                await registerWithEmail(email, password, name.trim(), null, COLORS[selectedColor]);
            } else {
                await loginWithEmail(email, password);
            }
            navigate('/');
        } catch (e) {
            setError(translateError(e.code));
        }
        setLoading(false);
    }

    async function handleGoogle() {
        setLoading(true);
        try {
            await loginWithGoogle();
            navigate('/');
        } catch (e) {
            setError(translateError(e.code));
        }
        setLoading(false);
    }

    return (
        <div className="page">
            <div className="page-content">
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="text-center" style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 56, marginBottom: 8 }} className="animate-float">🎮</div>
                    <h1 className="title gradient-text">تتحدى؟</h1>
                    <p className="subtitle">من يقدر يتحدى</p>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }} className="card card-lg">

                    {/* Tabs */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
                        background: 'var(--surface2)', borderRadius: 10, padding: 4, marginBottom: 24
                    }}>
                        {['login', 'register'].map(m => (
                            <button key={m} onClick={() => { setMode(m); setError(''); }}
                                style={{
                                    padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    fontFamily: 'Cairo', fontWeight: 700, fontSize: 15, transition: 'all 0.2s',
                                    background: mode === m ? 'linear-gradient(135deg, var(--primary), #5b21b6)' : 'transparent',
                                    color: mode === m ? 'white' : 'var(--text-muted)',
                                }}>
                                {m === 'login' ? '🔑 تسجيل دخول' : '✨ حساب جديد'}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Google */}
                        <button className="btn btn-secondary btn-full" onClick={handleGoogle} disabled={loading}
                            style={{ gap: 10 }}>
                            <svg width="18" height="18" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                            </svg>
                            الدخول بـ Google
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 12 }}>
                            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                            أو
                            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        </div>

                        {mode === 'register' && (
                            <>
                                <div>
                                    <label className="label">الاسم في اللعبة</label>
                                    <input className="input" placeholder="أدخل اسمك..." value={name}
                                        onChange={e => setName(e.target.value)} maxLength={20} />
                                </div>
                                <div>
                                    <label className="label">لون ملفك</label>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {COLORS.map((c, i) => (
                                            <button key={i} onClick={() => setSelectedColor(i)} style={{
                                                width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer', border: 'none',
                                                outline: selectedColor === i ? `3px solid white` : '3px solid transparent',
                                                boxShadow: selectedColor === i ? `0 0 10px ${c}` : 'none',
                                                transition: 'all 0.2s',
                                            }} />
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="label">البريد الإلكتروني</label>
                            <input className="input" type="email" placeholder="example@email.com"
                                value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <label className="label">كلمة المرور</label>
                            <input className="input" type="password" placeholder="••••••••"
                                value={password} onChange={e => setPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                        </div>

                        {error && <p style={{ color: 'var(--danger)', textAlign: 'center', fontSize: 14 }}>{error}</p>}

                        <button className="btn btn-primary btn-lg btn-full" onClick={handleSubmit} disabled={loading}>
                            {loading ? '⏳ جاري...' : mode === 'login' ? '🔑 دخول' : '✨ إنشاء الحساب'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function translateError(code) {
    const map = {
        'auth/email-already-in-use': 'البريد مستخدم بالفعل',
        'auth/invalid-email': 'بريد إلكتروني غير صحيح',
        'auth/wrong-password': 'كلمة المرور خاطئة',
        'auth/user-not-found': 'الحساب غير موجود',
        'auth/weak-password': 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)',
        'auth/popup-closed-by-user': 'تم إغلاق نافذة تسجيل Google',
        'auth/invalid-credential': 'بيانات الدخول غير صحيحة',
    };
    return map[code] || 'حدث خطأ، حاول مرة أخرى';
}
