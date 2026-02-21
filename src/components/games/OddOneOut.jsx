import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OddOneOut({ roundData, timeLeft, onScore, submitted }) {
    const [current, setCurrent] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [correctCount, setCorrectCount] = useState(0);

    const rounds = roundData?.rounds || [];
    const r = rounds[current];

    useEffect(() => {
        if (timeLeft === 0 && !submitted) onScore(correctCount * 20);
    }, [timeLeft]);

    function choose(i) {
        if (feedback || submitted) return;
        const isCorrect = i === r.odd;
        setFeedback({ chosen: i, isCorrect });
        if (isCorrect) setCorrectCount(c => c + 1);
        setTimeout(() => {
            setFeedback(null);
            if (current + 1 >= rounds.length) {
                onScore((correctCount + (isCorrect ? 1 : 0)) * 20);
            } else {
                setCurrent(c => c + 1);
            }
        }, 1000);
    }

    if (!r) return null;

    return (
        <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ marginBottom: 12, color: 'var(--text-muted)' }}>
                {current + 1} / {rounds.length} | ✅ {correctCount}
            </div>
            <div className="card" style={{ marginBottom: 16, padding: 20 }}>
                <p style={{ fontSize: 18, fontWeight: 700 }}>🕵️ أيّها لا ينتمي للمجموعة؟</p>
            </div>
            <AnimatePresence mode="wait">
                <motion.div key={current} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {r.items.map((item, i) => {
                            let cls = 'option-btn';
                            if (feedback) {
                                if (i === r.odd) cls += ' correct';
                                else if (i === feedback.chosen && !feedback.isCorrect) cls += ' wrong';
                            }
                            return (
                                <button key={i} className={cls} onClick={() => choose(i)}
                                    disabled={!!feedback || submitted}
                                    style={{ textAlign: 'center', fontSize: 18, padding: 20 }}>
                                    {item}
                                </button>
                            );
                        })}
                    </div>
                    {feedback && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 14 }}>
                            {feedback.isCorrect ? `✅ صحيح! "${r.items[r.odd]}" ${r.reason}` : `❌ الدخيل هو "${r.items[r.odd]}" - ${r.reason}`}
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
