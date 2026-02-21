import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function WordScramble({ roundData, timeLeft, onScore, submitted }) {
    const [answer, setAnswer] = useState('');
    const [result, setResult] = useState(null);

    const { word, scrambled } = roundData || {};

    useEffect(() => {
        if (timeLeft === 0 && !submitted) onScore(0);
    }, [timeLeft]);

    function checkAnswer() {
        if (!answer.trim() || submitted || result) return;
        const correct = answer.trim() === word;
        setResult(correct ? 'correct' : 'wrong');
        if (correct) {
            const score = Math.round((timeLeft / 30) * 80) + 20;
            onScore(score);
        }
    }

    if (!word) return null;

    return (
        <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
            <div className="card" style={{ marginBottom: 20, padding: 32 }}>
                <div style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 8 }}>رتّب الحروف لتكوّن كلمة!</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
                    {scrambled.split('').map((char, i) => (
                        <motion.span
                            key={i}
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 52, height: 52, borderRadius: 10, fontSize: 24, fontWeight: 900,
                                background: 'linear-gradient(135deg, var(--primary), #5b21b6)',
                                color: 'white', boxShadow: '0 4px 12px var(--primary-glow)',
                            }}
                        >{char}</motion.span>
                    ))}
                </div>
            </div>

            <input
                className="input"
                placeholder="اكتب الكلمة..."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkAnswer()}
                disabled={submitted || !!result}
                style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, marginBottom: 10 }}
                autoFocus
            />

            {result && (
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                    className="card" style={{
                        marginBottom: 10, padding: 16, textAlign: 'center',
                        borderColor: result === 'correct' ? 'var(--success)' : 'var(--danger)',
                        background: result === 'correct' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    }}>
                    {result === 'correct' ? '✅ صحيح!' : `❌ الكلمة الصحيحة: ${word}`}
                </motion.div>
            )}

            <button className="btn btn-primary btn-lg btn-full" onClick={checkAnswer}
                disabled={submitted || !!result || !answer.trim()}>
                ✔️ تأكيد
            </button>
        </div>
    );
}
