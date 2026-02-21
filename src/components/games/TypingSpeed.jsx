import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function TypingSpeed({ roundData, timeLeft, onScore, submitted }) {
    const [typed, setTyped] = useState('');
    const [done, setDone] = useState(false);
    const [startTime] = useState(Date.now());
    const inputRef = useRef(null);

    const text = roundData?.text || '';

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (timeLeft === 0 && !submitted && !done) {
            const correctChars = countCorrect();
            const score = Math.round((correctChars / text.length) * 80);
            onScore(score);
        }
    }, [timeLeft]);

    function countCorrect() {
        let count = 0;
        for (let i = 0; i < typed.length; i++) {
            if (typed[i] === text[i]) count++;
        }
        return count;
    }

    function handleChange(e) {
        if (done || submitted) return;
        const val = e.target.value;
        setTyped(val);
        if (val === text) {
            setDone(true);
            const elapsed = (Date.now() - startTime) / 1000;
            const wpm = Math.round((text.length / 5) / (elapsed / 60));
            const score = Math.min(100, Math.round(wpm * 1.5));
            onScore(score);
        }
    }

    const correctChars = countCorrect();
    const accuracy = typed.length > 0 ? Math.round((correctChars / typed.length) * 100) : 100;

    return (
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12, justifyContent: 'center' }}>
                <span className="badge badge-primary">دقة: {accuracy}%</span>
                <span className="badge badge-cyan">✅ {correctChars}/{text.length}</span>
            </div>

            {/* Text display */}
            <div className="card" style={{ marginBottom: 16, padding: 24, fontSize: 20, lineHeight: 2, direction: 'rtl' }}>
                {text.split('').map((char, i) => {
                    let color = 'var(--text-muted)';
                    if (i < typed.length) {
                        color = typed[i] === char ? 'var(--success)' : 'var(--danger)';
                    }
                    return (
                        <span key={i} style={{
                            color,
                            background: i === typed.length ? 'rgba(124,58,237,0.3)' : 'transparent',
                            borderRadius: 2,
                        }}>{char}</span>
                    );
                })}
            </div>

            <textarea
                ref={inputRef}
                className="input"
                placeholder="ابدأ الكتابة هنا..."
                value={typed}
                onChange={handleChange}
                disabled={done || submitted}
                rows={3}
                style={{ resize: 'none', fontSize: 18 }}
            />

            {done && (
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                    className="card" style={{
                        marginTop: 12, textAlign: 'center', padding: 16,
                        borderColor: 'var(--success)', background: 'rgba(34,197,94,0.1)'
                    }}>
                    🎉 أنهيت النص! ممتاز!
                </motion.div>
            )}
        </div>
    );
}
