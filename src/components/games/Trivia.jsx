import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Trivia({ roundData, timeLeft, onScore, submitted }) {
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState(null);
    const [correctCount, setCorrectCount] = useState(0);
    const [showResult, setShowResult] = useState(false);

    const questions = roundData?.questions || [];
    const q = questions[current];

    useEffect(() => {
        if (timeLeft === 0 && !submitted) onScore(correctCount * 20);
    }, [timeLeft]);

    function choose(i) {
        if (selected !== null || submitted) return;
        setSelected(i);
        setShowResult(true);
        const isCorrect = i === q.answer;
        if (isCorrect) setCorrectCount(c => c + 1);
        setTimeout(() => {
            setShowResult(false);
            setSelected(null);
            if (current + 1 >= questions.length) {
                onScore((correctCount + (isCorrect ? 1 : 0)) * 20);
            } else {
                setCurrent(c => c + 1);
            }
        }, 1200);
    }

    if (!q) return null;

    return (
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ marginBottom: 8, color: 'var(--text-muted)', textAlign: 'center' }}>
                سؤال {current + 1} / {questions.length}
            </div>
            <AnimatePresence mode="wait">
                <motion.div key={current} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}>
                    <div className="card" style={{ textAlign: 'center', marginBottom: 16, padding: '24px' }}>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{q.q}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {q.options.map((opt, i) => (
                            <button
                                key={i}
                                className={`option-btn ${showResult && i === q.answer ? 'correct' : showResult && i === selected && i !== q.answer ? 'wrong' : ''}`}
                                onClick={() => choose(i)}
                                disabled={selected !== null || submitted}
                            >
                                <span style={{ marginLeft: 8, opacity: 0.5 }}>{['أ', 'ب', 'ج', 'د'][i]}</span> {opt}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
            <div style={{ marginTop: 12, textAlign: 'center', color: 'var(--text-muted)' }}>
                ✅ صح: {correctCount} | النقاط: {correctCount * 20}
            </div>
        </div>
    );
}
