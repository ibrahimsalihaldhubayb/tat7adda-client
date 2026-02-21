import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function MemoryGrid({ roundData, timeLeft, onScore, submitted }) {
    const [cards, setCards] = useState([]);
    const [flipped, setFlipped] = useState([]);
    const [matched, setMatched] = useState([]);
    const [moves, setMoves] = useState(0);
    const [phase, setPhase] = useState('memorize'); // memorize | play
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        if (!roundData?.cards) return;
        setCards(roundData.cards.map(c => ({ ...c, flipped: true, matched: false })));
        // Show all cards for 3 seconds then hide
        const t = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) {
                    clearInterval(t);
                    setPhase('play');
                    setCards(prev => prev.map(c => ({ ...c, flipped: false })));
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (timeLeft === 0 && !submitted) {
            const score = Math.max(0, matched.length * 15 - moves * 2);
            onScore(score);
        }
    }, [timeLeft]);

    function flip(id) {
        if (phase !== 'play' || submitted) return;
        if (flipped.length === 2 || flipped.includes(id) || matched.includes(id)) return;

        const newFlipped = [...flipped, id];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            const [a, b] = newFlipped.map(fid => cards.find(c => c.id === fid));
            if (a.emoji === b.emoji) {
                const newMatched = [...matched, a.id, b.id];
                setMatched(newMatched);
                setFlipped([]);
                if (newMatched.length === cards.length) {
                    const score = Math.max(10, 100 - moves * 5);
                    onScore(score);
                }
            } else {
                setTimeout(() => setFlipped([]), 800);
            }
        }
    }

    return (
        <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
            {phase === 'memorize' && (
                <div className="card" style={{ marginBottom: 16, padding: 16 }}>
                    <p style={{ fontSize: 18, fontWeight: 700 }}>👀 احفظ مواضع البطاقات!</p>
                    <p style={{ fontSize: 48, fontWeight: 900, color: 'var(--accent)' }}>{countdown}</p>
                </div>
            )}
            {phase === 'play' && (
                <div style={{ marginBottom: 12, color: 'var(--text-muted)' }}>
                    ✅ {matched.length / 2} أزواج | 🔄 {moves} محاولة
                </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {cards.map(card => {
                    const isFlipped = flipped.includes(card.id) || matched.includes(card.id) || phase === 'memorize';
                    return (
                        <motion.button
                            key={card.id}
                            whileHover={!isFlipped && phase === 'play' ? { scale: 1.05 } : {}}
                            whileTap={!isFlipped && phase === 'play' ? { scale: 0.95 } : {}}
                            onClick={() => flip(card.id)}
                            style={{
                                height: 70, borderRadius: 10, fontSize: 28, cursor: 'pointer',
                                border: matched.includes(card.id) ? '2px solid var(--success)' : '2px solid var(--border)',
                                background: isFlipped
                                    ? matched.includes(card.id) ? 'rgba(34,197,94,0.15)' : 'var(--surface2)'
                                    : 'linear-gradient(135deg, var(--primary), #5b21b6)',
                                transition: 'all 0.3s',
                            }}
                        >
                            {isFlipped ? card.emoji : '❓'}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
