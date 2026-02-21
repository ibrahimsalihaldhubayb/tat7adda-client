import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ColorMatch({ roundData, timeLeft, onScore, submitted }) {
    const [current, setCurrent] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [feedback, setFeedback] = useState(null);

    const rounds = roundData?.rounds || [];
    const r = rounds[current];

    useEffect(() => {
        if (timeLeft === 0 && !submitted) onScore(correctCount * 12);
    }, [timeLeft]);

    function choose(opt) {
        if (feedback || submitted) return;
        const isCorrect = opt === r.answer;
        setFeedback(isCorrect ? 'correct' : 'wrong');
        if (isCorrect) setCorrectCount(c => c + 1);
        setTimeout(() => {
            setFeedback(null);
            if (current + 1 >= rounds.length) {
                onScore((correctCount + (isCorrect ? 1 : 0)) * 12);
            } else {
                setCurrent(c => c + 1);
            }
        }, 700);
    }

    if (!r) return null;

    return (
        <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ marginBottom: 12, color: 'var(--text-muted)' }}>
                {current + 1} / {rounds.length} | ✅ {correctCount}
            </div>
            <AnimatePresence mode="wait">
                <motion.div key={current} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <div style={{
                        width: 160, height: 160, borderRadius: 20, margin: '0 auto 20px',
                        background: r.displayColor,
                        boxShadow: `0 0 40px ${r.displayColor}80`,
                    }} />
                    <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>ما اسم هذا اللون؟</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {r.options.map((opt, i) => (
                            <button
                                key={i}
                                className={`option-btn ${feedback && opt === r.answer ? 'correct' : feedback && opt !== r.answer ? 'wrong' : ''}`}
                                onClick={() => choose(opt)}
                                disabled={!!feedback || submitted}
                                style={{ textAlign: 'center' }}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
