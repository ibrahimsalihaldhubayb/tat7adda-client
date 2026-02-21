import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReactionClick({ roundData, timeLeft, onScore, submitted }) {
    const [phase, setPhase] = useState('waiting'); // waiting | ready | click | done
    const [results, setResults] = useState([]);
    const [current, setCurrent] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const timerRef = useRef(null);

    const delays = roundData?.delays || [2000, 3000, 1500, 2500, 1000];

    useEffect(() => {
        if (submitted) return;
        scheduleNext(0);
        return () => clearTimeout(timerRef.current);
    }, []);

    useEffect(() => {
        if (timeLeft === 0 && !submitted) {
            const avg = results.length > 0 ? results.reduce((a, b) => a + b, 0) / results.length : 9999;
            const score = Math.max(0, Math.round(100 - avg / 20));
            onScore(score);
        }
    }, [timeLeft]);

    function scheduleNext(idx) {
        if (idx >= delays.length) { setPhase('done'); return; }
        setPhase('waiting');
        timerRef.current = setTimeout(() => {
            setPhase('ready');
            setStartTime(Date.now());
        }, delays[idx]);
    }

    function handleClick() {
        if (phase === 'waiting') {
            // Too early
            setPhase('waiting');
            return;
        }
        if (phase === 'ready') {
            const rt = Date.now() - startTime;
            const newResults = [...results, rt];
            setResults(newResults);
            setPhase('click');
            const next = current + 1;
            setCurrent(next);
            setTimeout(() => scheduleNext(next), 800);
        }
    }

    const avgRT = results.length > 0 ? Math.round(results.reduce((a, b) => a + b, 0) / results.length) : null;

    return (
        <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ marginBottom: 16, color: 'var(--text-muted)' }}>
                {current} / {delays.length} | {avgRT ? `متوسط: ${avgRT}ms` : 'اضغط عند ظهور الهدف!'}
            </div>

            <motion.button
                onClick={handleClick}
                disabled={submitted || phase === 'done'}
                style={{
                    width: '100%', height: 220, borderRadius: 20, fontSize: 64,
                    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                    background: phase === 'ready'
                        ? 'linear-gradient(135deg, var(--success), #15803d)'
                        : phase === 'waiting'
                            ? 'linear-gradient(135deg, var(--danger), #b91c1c)'
                            : 'var(--surface)',
                    boxShadow: phase === 'ready' ? '0 0 40px rgba(34,197,94,0.5)' : 'none',
                }}
                whileTap={phase === 'ready' ? { scale: 0.95 } : {}}
            >
                {phase === 'waiting' ? '🔴' : phase === 'ready' ? '🟢' : phase === 'click' ? '⚡' : '✅'}
            </motion.button>

            <p style={{ marginTop: 16, fontSize: 18, fontWeight: 700 }}>
                {phase === 'waiting' ? 'انتظر...' :
                    phase === 'ready' ? 'اضغط الآن! ⚡' :
                        phase === 'click' ? `${results[results.length - 1]}ms` :
                            `انتهى! متوسط: ${avgRT}ms`}
            </p>

            {results.length > 0 && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                    {results.map((r, i) => (
                        <span key={i} className="badge badge-cyan">{r}ms</span>
                    ))}
                </div>
            )}
        </div>
    );
}
