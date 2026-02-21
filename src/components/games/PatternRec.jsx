import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatternRec({ roundData, timeLeft, onScore, submitted }) {
    const [current, setCurrent] = useState(0);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [correctCount, setCorrectCount] = useState(0);

    const patterns = roundData?.patterns || [];
    const p = patterns[current];

    useEffect(() => {
        if (timeLeft === 0 && !submitted) onScore(correctCount * 20);
    }, [timeLeft]);

    function checkAnswer() {
        if (!answer || feedback || submitted) return;
        const isCorrect = parseInt(answer) === p.answer;
        setFeedback(isCorrect ? 'correct' : 'wrong');
        if (isCorrect) setCorrectCount(c => c + 1);
        setTimeout(() => {
            setFeedback(null);
            setAnswer('');
            if (current + 1 >= patterns.length) {
                onScore((correctCount + (isCorrect ? 1 : 0)) * 20);
            } else {
                setCurrent(c => c + 1);
            }
        }, 800);
    }

    if (!p) return null;

    return (
        <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ marginBottom: 12, color: 'var(--text-muted)' }}>
                نمط {current + 1} / {patterns.length} | ✅ {correctCount}
            </div>
            <AnimatePresence mode="wait">
                <motion.div key={current} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <div className="card" style={{ marginBottom: 20, padding: 24 }}>
                        <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 12 }}>أكمل النمط:</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                            {p.sequence.map((num, i) => (
                                <div key={i} style={{
                                    width: 60, height: 60, borderRadius: 12, fontSize: 22, fontWeight: 900,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'linear-gradient(135deg, var(--primary), #5b21b6)',
                                    color: 'white',
                                }}>{num}</div>
                            ))}
                            <div style={{ fontSize: 28, color: 'var(--text-muted)' }}>→</div>
                            <div style={{
                                width: 60, height: 60, borderRadius: 12, fontSize: 22, fontWeight: 900,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: `2px dashed ${feedback === 'correct' ? 'var(--success)' : feedback === 'wrong' ? 'var(--danger)' : 'var(--primary)'}`,
                                color: feedback === 'correct' ? 'var(--success)' : feedback === 'wrong' ? 'var(--danger)' : 'var(--text-muted)',
                            }}>
                                {feedback ? p.answer : '?'}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <input
                className="input"
                type="number"
                placeholder="الرقم التالي..."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkAnswer()}
                disabled={submitted || !!feedback}
                style={{ textAlign: 'center', fontSize: 24, fontWeight: 700, marginBottom: 10 }}
                autoFocus
            />
            <button className="btn btn-primary btn-lg btn-full" onClick={checkAnswer}
                disabled={submitted || !!feedback || !answer}>
                ✔️ تأكيد
            </button>
        </div>
    );
}
