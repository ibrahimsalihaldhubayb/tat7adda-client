import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LogicPuzzle({ roundData, timeLeft, onScore, submitted }) {
    const [answer, setAnswer] = useState('');
    const [showHint, setShowHint] = useState(false);
    const [result, setResult] = useState(null); // 'correct' | 'wrong'

    const puzzle = roundData?.puzzle;

    useEffect(() => {
        if (timeLeft === 0 && !submitted) onScore(0);
    }, [timeLeft]);

    function checkAnswer() {
        if (!answer.trim() || submitted || result) return;
        const correct = answer.trim().toLowerCase().includes(puzzle.answer.toLowerCase()) ||
            puzzle.answer.toLowerCase().includes(answer.trim().toLowerCase());
        setResult(correct ? 'correct' : 'wrong');
        if (correct) {
            const bonus = showHint ? 30 : 50;
            onScore(bonus);
        }
    }

    if (!puzzle) return null;

    return (
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <div className="card" style={{ textAlign: 'center', padding: 32, marginBottom: 16 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔮</div>
                <p style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.6 }}>{puzzle.q}</p>
            </div>

            {showHint && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="card" style={{ marginBottom: 12, padding: '10px 16px', borderColor: 'rgba(245,158,11,0.3)' }}>
                    <span style={{ color: 'var(--accent)' }}>💡 تلميح: {puzzle.hint}</span>
                </motion.div>
            )}

            <input
                className="input"
                placeholder="اكتب إجابتك هنا..."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkAnswer()}
                disabled={submitted || !!result}
                style={{ marginBottom: 10 }}
            />

            {result && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="card" style={{
                        textAlign: 'center', marginBottom: 10, padding: 16,
                        borderColor: result === 'correct' ? 'var(--success)' : 'var(--danger)',
                        background: result === 'correct' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    }}>
                    {result === 'correct' ? '✅ صحيح! أحسنت!' : `❌ الإجابة الصحيحة: ${puzzle.answer}`}
                </motion.div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {!showHint && !result && (
                    <button className="btn btn-secondary" onClick={() => setShowHint(true)}>
                        💡 تلميح (-20 نقطة)
                    </button>
                )}
                <button
                    className="btn btn-primary"
                    style={{ gridColumn: showHint || result ? '1 / -1' : undefined }}
                    onClick={checkAnswer}
                    disabled={submitted || !!result || !answer.trim()}
                >
                    ✔️ تأكيد الإجابة
                </button>
            </div>
        </div>
    );
}
