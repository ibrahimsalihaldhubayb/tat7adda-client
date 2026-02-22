import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════
// بيانات الأسئلة - يمكنك تعديلها مباشرة هنا
// ═══════════════════════════════════════════

const initialQuestions = {
    trivia: {
        name: 'معلومات عامة 🧠',
        color: '#3b82f6',
        questions: [
            { q: 'ما هي عاصمة فرنسا؟', options: ['برلين', 'باريس', 'روما', 'مدريد'], answer: 1 },
            { q: 'كم عدد أيام السنة الكبيسة؟', options: ['364', '365', '366', '367'], answer: 2 },
            { q: 'ما هو أكبر كوكب في المجموعة الشمسية؟', options: ['زحل', 'المريخ', 'المشتري', 'أورانوس'], answer: 2 },
            { q: 'من هو مخترع الهاتف؟', options: ['إديسون', 'بيل', 'تيسلا', 'نيوتن'], answer: 1 },
            { q: 'ما هي أسرع حيوان برّي؟', options: ['الأسد', 'الفهد', 'النمر', 'الذئب'], answer: 1 },
            { q: 'كم عدد ألوان قوس قزح؟', options: ['5', '6', '7', '8'], answer: 2 },
            { q: 'ما هو أطول نهر في العالم؟', options: ['الأمازون', 'النيل', 'الكونغو', 'الميسيسيبي'], answer: 1 },
            { q: 'كم عدد أضلاع المثلث؟', options: ['2', '3', '4', '5'], answer: 1 },
            { q: 'ما هو أصغر قارة في العالم؟', options: ['أوروبا', 'أستراليا', 'أنتاركتيكا', 'أمريكا الجنوبية'], answer: 1 },
            { q: 'ما هي لغة البرمجة التي تستخدم Python كاسم؟', options: ['ثعبان', 'أفعى', 'تنين', 'ضفدع'], answer: 0 },
        ],
    },
    logic_puzzle: {
        name: 'لغز منطقي 🔮',
        color: '#14b8a6',
        questions: [
            { q: 'أنا دائماً أمامك لكن لا يمكنك رؤيتي. ما أنا؟', answer: 'المستقبل', hint: 'يتعلق بالزمن' },
            { q: 'كلما أخذت منه، كلما كبر. ما هو؟', answer: 'الحفرة', hint: 'شيء في الأرض' },
            { q: 'ما الشيء الذي له أسنان لكن لا يعضّ؟', answer: 'المشط', hint: 'يُستخدم للشعر' },
            { q: 'ما الشيء الذي يمشي على أربع في الصباح وعلى اثنتين في الظهر وعلى ثلاث في المساء؟', answer: 'الإنسان', hint: 'لغز أبو الهول' },
            { q: 'ما الشيء الذي كلما ملأته خفّ وزنه؟', answer: 'البالون', hint: 'يطير في الهواء' },
        ],
    },
    word_scramble: {
        name: 'الكلمة المشوّشة 🔤',
        color: '#22c55e',
        questions: [
            { word: 'برتقال' }, { word: 'كمبيوتر' }, { word: 'مدرسة' },
            { word: 'سيارة' }, { word: 'طائرة' }, { word: 'مستشفى' },
            { word: 'جامعة' }, { word: 'مطبخ' }, { word: 'رياضة' },
            { word: 'موسيقى' },
        ],
    },
    odd_one_out: {
        name: 'الدخيل 🕵️',
        color: '#84cc16',
        questions: [
            { items: ['تفاح', 'موز', 'سيارة', 'برتقال'], odd: 2, reason: 'ليست فاكهة' },
            { items: ['كلب', 'قطة', 'سمكة', 'طاولة'], odd: 3, reason: 'ليست حيواناً' },
            { items: ['أحمر', 'أزرق', 'كبير', 'أخضر'], odd: 2, reason: 'ليس لوناً' },
            { items: ['باريس', 'لندن', 'طوكيو', 'نيل'], odd: 3, reason: 'ليست مدينة' },
            { items: ['جمع', 'طرح', 'ضرب', 'كتابة'], odd: 3, reason: 'ليست عملية حسابية' },
        ],
    },
    typing_speed: {
        name: 'سرعة الكتابة ⌨️',
        color: '#06b6d4',
        questions: [
            { text: 'البرمجة فن وعلم في آن واحد' },
            { text: 'التكنولوجيا تغير العالم كل يوم' },
            { text: 'العقل السليم في الجسم السليم' },
            { text: 'من جد وجد ومن زرع حصد' },
            { text: 'الوقت من ذهب فلا تضيعه' },
        ],
    },
};

// ═══════════════════════════════════════════════════════════
// المكوّن الرئيسي
// ═══════════════════════════════════════════════════════════

export default function QuestionsEditor() {
    const navigate = useNavigate();
    const [data, setData] = useState(initialQuestions);
    const [activeGame, setActiveGame] = useState('trivia');
    const [editIdx, setEditIdx] = useState(null);  // null = لا يوجد تعديل
    const [editObj, setEditObj] = useState(null);  // كائن التعديل المؤقت
    const [saved, setSaved] = useState(false);

    const game = data[activeGame];

    function startEdit(idx) {
        setEditIdx(idx);
        setEditObj(JSON.parse(JSON.stringify(game.questions[idx])));
    }

    function saveEdit() {
        const updated = [...game.questions];
        updated[editIdx] = editObj;
        setData(prev => ({ ...prev, [activeGame]: { ...prev[activeGame], questions: updated } }));
        setEditIdx(null);
        setEditObj(null);
    }

    function deleteQ(idx) {
        if (!confirm('هل تريد حذف هذا السؤال؟')) return;
        const updated = game.questions.filter((_, i) => i !== idx);
        setData(prev => ({ ...prev, [activeGame]: { ...prev[activeGame], questions: updated } }));
    }

    function addNew() {
        const type = activeGame;
        let newQ;
        if (type === 'trivia') newQ = { q: 'سؤال جديد', options: ['خيار 1', 'خيار 2', 'خيار 3', 'خيار 4'], answer: 0 };
        else if (type === 'logic_puzzle') newQ = { q: 'لغز جديد', answer: 'الجواب', hint: 'تلميح' };
        else if (type === 'word_scramble') newQ = { word: 'كلمة' };
        else if (type === 'odd_one_out') newQ = { items: ['عنصر 1', 'عنصر 2', 'الدخيل', 'عنصر 4'], odd: 2, reason: 'السبب' };
        else if (type === 'typing_speed') newQ = { text: 'نص جديد للكتابة' };

        const updated = [...game.questions, newQ];
        setData(prev => ({ ...prev, [activeGame]: { ...prev[activeGame], questions: updated } }));
        startEdit(updated.length - 1);
    }

    function exportJSON() {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'questions.json'; a.click();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    return (
        <div style={{ minHeight: '100vh', padding: '16px', maxWidth: 720, margin: '0 auto' }}>

            {/* Header */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')}>← رجوع</button>
                <h1 className="gradient-text" style={{ fontSize: 20, fontWeight: 900 }}>📝 محرر الأسئلة</h1>
                <motion.button whileTap={{ scale: 0.95 }} onClick={exportJSON}
                    style={{
                        padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        fontFamily: 'Cairo', fontWeight: 700, fontSize: 13,
                        background: saved ? '#10b981' : 'linear-gradient(135deg, var(--primary), #5b21b6)',
                        color: 'white', transition: 'background 0.3s'
                    }}>
                    {saved ? '✅ تم' : '💾 تصدير'}
                </motion.button>
            </motion.div>

            {/* Game Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
                {Object.entries(data).map(([id, g]) => (
                    <motion.button key={id} whileTap={{ scale: 0.95 }}
                        onClick={() => { setActiveGame(id); setEditIdx(null); }}
                        style={{
                            padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                            fontFamily: 'Cairo', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0,
                            background: activeGame === id ? `${g.color}25` : 'var(--surface)',
                            color: activeGame === id ? g.color : 'var(--text-muted)',
                            border: `2px solid ${activeGame === id ? g.color + '60' : 'var(--border)'}`,
                            transition: 'all 0.2s'
                        }}>
                        {g.name} <span style={{ opacity: 0.6 }}>({g.questions.length})</span>
                    </motion.button>
                ))}
            </div>

            {/* Questions List */}
            <motion.div key={activeGame} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 15, color: game.color }}>
                        {game.name} — {game.questions.length} سؤال
                    </h3>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={addNew}
                        style={{
                            padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                            fontFamily: 'Cairo', fontWeight: 700, fontSize: 13,
                            background: `${game.color}20`, color: game.color,
                            border: `1.5px solid ${game.color}40`
                        }}>
                        ➕ إضافة سؤال
                    </motion.button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <AnimatePresence>
                        {game.questions.map((q, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }} transition={{ delay: i * 0.03 }}>

                                {/* عرض السؤال (حالة القراءة) */}
                                {editIdx !== i && (
                                    <div style={{
                                        display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 12,
                                        background: 'var(--surface)', border: `1px solid var(--border)`,
                                        alignItems: 'flex-start'
                                    }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                            background: `${game.color}20`, color: game.color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 12, fontWeight: 800, border: `1.5px solid ${game.color}40`
                                        }}>{i + 1}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <QuestionPreview q={q} type={activeGame} color={game.color} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                            <button onClick={() => startEdit(i)}
                                                style={{
                                                    padding: '6px 10px', borderRadius: 8, border: 'none',
                                                    cursor: 'pointer', background: `${game.color}15`, color: game.color,
                                                    fontSize: 14, fontFamily: 'Cairo'
                                                }}>✏️</button>
                                            <button onClick={() => deleteQ(i)}
                                                style={{
                                                    padding: '6px 10px', borderRadius: 8, border: 'none',
                                                    cursor: 'pointer', background: 'rgba(239,68,68,0.12)',
                                                    color: '#ef4444', fontSize: 14, fontFamily: 'Cairo'
                                                }}>🗑️</button>
                                        </div>
                                    </div>
                                )}

                                {/* تعديل السؤال */}
                                {editIdx === i && editObj && (
                                    <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }}
                                        style={{
                                            padding: '16px', borderRadius: 14,
                                            background: `${game.color}10`,
                                            border: `2px solid ${game.color}50`
                                        }}>
                                        <QuestionEditor
                                            type={activeGame} obj={editObj}
                                            onChange={setEditObj} color={game.color}
                                        />
                                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                            <button onClick={saveEdit}
                                                style={{
                                                    flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                                                    cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 700,
                                                    background: game.color, color: 'white'
                                                }}>✅ حفظ</button>
                                            <button onClick={() => { setEditIdx(null); setEditObj(null); }}
                                                style={{
                                                    padding: '10px 16px', borderRadius: 10, border: 'none',
                                                    cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 700,
                                                    background: 'var(--surface)', color: 'var(--text-muted)'
                                                }}>إلغاء</button>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* How to save note */}
            <div style={{
                padding: '12px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.2)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6
            }}>
                <strong style={{ color: '#f59e0b' }}>💡 كيف تحفظ التعديلات؟</strong><br />
                اضغط <strong>"تصدير"</strong> لتنزيل الأسئلة كملف JSON، ثم انسخ المحتوى واستبدل قسم <code>initialQuestions</code> في هذا الملف.
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// مكوّن معاينة السؤال
// ═══════════════════════════════════════════
function QuestionPreview({ q, type, color }) {
    if (type === 'trivia') {
        return (
            <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{q.q}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {q.options.map((opt, i) => (
                        <span key={i} style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: 12,
                            background: i === q.answer ? `${color}20` : 'var(--surface2)',
                            color: i === q.answer ? color : 'var(--text-muted)',
                            border: `1px solid ${i === q.answer ? color + '40' : 'transparent'}`,
                            fontWeight: i === q.answer ? 700 : 400
                        }}>
                            {i === q.answer ? '✓ ' : ''}{opt}
                        </span>
                    ))}
                </div>
            </div>
        );
    }
    if (type === 'logic_puzzle') return (
        <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{q.q}</div>
            <div style={{ fontSize: 12, color, marginTop: 4 }}>الجواب: {q.answer}</div>
            {q.hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>💡 {q.hint}</div>}
        </div>
    );
    if (type === 'word_scramble') return (
        <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: 2 }}>{q.word}</div>
    );
    if (type === 'odd_one_out') return (
        <div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                {q.items.map((item, i) => (
                    <span key={i} style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 12,
                        background: i === q.odd ? 'rgba(239,68,68,0.15)' : 'var(--surface2)',
                        color: i === q.odd ? '#ef4444' : 'var(--text-muted)',
                        border: `1px solid ${i === q.odd ? 'rgba(239,68,68,0.3)' : 'transparent'}`,
                        fontWeight: i === q.odd ? 700 : 400
                    }}>
                        {item}
                    </span>
                ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>الدخيل: {q.items[q.odd]} — {q.reason}</div>
        </div>
    );
    if (type === 'typing_speed') return (
        <div style={{ fontWeight: 600, fontSize: 14, fontStyle: 'italic' }}>"{q.text}"</div>
    );
    return <div style={{ fontSize: 13 }}>{JSON.stringify(q)}</div>;
}

// ═══════════════════════════════════════════
// مكوّن تعديل السؤال
// ═══════════════════════════════════════════
function QuestionEditor({ type, obj, onChange, color }) {
    const inp = (label, field, value, onChg) => (
        <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</label>
            <input value={value} onChange={e => onChg(e.target.value)}
                style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${color}40`,
                    background: 'var(--surface)', color: 'var(--text)', fontFamily: 'Cairo',
                    fontSize: 14, boxSizing: 'border-box'
                }} />
        </div>
    );

    if (type === 'trivia') return (
        <div>
            {inp('السؤال', 'q', obj.q, v => onChange({ ...obj, q: v }))}
            {obj.options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <input value={opt} onChange={e => {
                        const opts = [...obj.options]; opts[i] = e.target.value;
                        onChange({ ...obj, options: opts });
                    }} style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8,
                        border: `1.5px solid ${i === obj.answer ? color : 'var(--border)'}`,
                        background: 'var(--surface)', color: 'var(--text)', fontFamily: 'Cairo', fontSize: 14
                    }} />
                    <button onClick={() => onChange({ ...obj, answer: i })}
                        style={{
                            padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: i === obj.answer ? color : 'var(--surface2)',
                            color: i === obj.answer ? 'white' : 'var(--text-muted)', fontFamily: 'Cairo', fontSize: 12
                        }}>
                        {i === obj.answer ? '✓ صح' : 'صح؟'}
                    </button>
                </div>
            ))}
        </div>
    );

    if (type === 'logic_puzzle') return (
        <div>
            {inp('اللغز', 'q', obj.q, v => onChange({ ...obj, q: v }))}
            {inp('الجواب', 'answer', obj.answer, v => onChange({ ...obj, answer: v }))}
            {inp('التلميح', 'hint', obj.hint || '', v => onChange({ ...obj, hint: v }))}
        </div>
    );

    if (type === 'word_scramble') return inp('الكلمة', 'word', obj.word, v => onChange({ ...obj, word: v }));

    if (type === 'odd_one_out') return (
        <div>
            {obj.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <input value={item} onChange={e => {
                        const items = [...obj.items]; items[i] = e.target.value;
                        onChange({ ...obj, items });
                    }} style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8,
                        border: `1.5px solid ${i === obj.odd ? '#ef4444' : 'var(--border)'}`,
                        background: 'var(--surface)', color: 'var(--text)', fontFamily: 'Cairo', fontSize: 14
                    }} />
                    <button onClick={() => onChange({ ...obj, odd: i })}
                        style={{
                            padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: i === obj.odd ? 'rgba(239,68,68,0.2)' : 'var(--surface2)',
                            color: i === obj.odd ? '#ef4444' : 'var(--text-muted)', fontFamily: 'Cairo', fontSize: 12
                        }}>
                        {i === obj.odd ? '🔴 دخيل' : 'دخيل?'}
                    </button>
                </div>
            ))}
            {inp('سبب كونه دخيلاً', 'reason', obj.reason, v => onChange({ ...obj, reason: v }))}
        </div>
    );

    if (type === 'typing_speed') return inp('النص للكتابة', 'text', obj.text, v => onChange({ ...obj, text: v }));

    return <pre style={{ fontSize: 12, color: 'var(--text-muted)' }}>{JSON.stringify(obj, null, 2)}</pre>;
}
