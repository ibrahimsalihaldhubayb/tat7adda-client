import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SpeedMath({ roundData, timeLeft, onScore, submitted }) {
    const [current, setCurrent] = useState(0);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
    const [correctCount, setCorrectCount] = useState(0);

    const questions = roundData?.questions || [];
    const q = questions[current];

    useEffect(() => {
        if (timeLeft === 0 && !submitted) {
            onScore(correctCount * 10);
        }
    }, [timeLeft]);

    function checkAnswer() {
        if (!q || submitted || feedback) return;
        const userAns = parseInt(answer);
        if (userAns === q.answer) {
            setFeedback('correct');
            setCorrectCount(c => c + 1);
        } else {
            setFeedback('wrong');
        }
        setTimeout(() => {
            setFeedback(null);
            setAnswer('');
            if (current + 1 >= questions.length) {
                onScore((correctCount + (userAns === q.answer ? 1 : 0)) * 10);
            } else {
                setCurrent(c => c + 1);
            }
        }, 600);
    }

    if (!q) return null;

    return (
        <div className="card card-lg text-center" style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{ fontSize: 18, color: 'var(--text-muted)', marginBottom: 8 }}>
                سؤال {current + 1} / {questions.length}
            </div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                >
                    <div style={{ fontSize: 52, fontWeight: 900, margin: '20px 0', letterSpacing: 4 }}>
                        {q.a} {q.op} {q.b} = ?
                    </div>
                </motion.div>
            </AnimatePresence>

            <input
                className="input"
                type="number"
                placeholder="الجواب..."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkAnswer()}
                disabled={submitted || !!feedback}
                style={{
                    textAlign: 'center', fontSize: 28, fontWeight: 700,
                    borderColor: feedback === 'correct' ? 'var(--success)' : feedback === 'wrong' ? 'var(--danger)' : undefined,
                }}
                autoFocus
            />
            <button
                className="btn btn-primary btn-lg btn-full"
                style={{ marginTop: 12 }}
                onClick={checkAnswer}
                disabled={submitted || !!feedback || !answer}
            >
                {feedback === 'correct' ? '✅ صح!' : feedback === 'wrong' ? '❌ خطأ!' : '✔️ تأكيد'}
            </button>

            <div style={{ marginTop: 16, color: 'var(--text-muted)' }}>
                ✅ صح: {correctCount} | النقاط: {correctCount * 10}
            </div>
        </div>
    );
}
