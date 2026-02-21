import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { useGame } from '../context/GameContext';

// Games
import SpeedMath from '../components/games/SpeedMath';
import Trivia from '../components/games/Trivia';
import MemoryGrid from '../components/games/MemoryGrid';
import ReactionClick from '../components/games/ReactionClick';
import LogicPuzzle from '../components/games/LogicPuzzle';
import WordScramble from '../components/games/WordScramble';
import ColorMatch from '../components/games/ColorMatch';
import PatternRec from '../components/games/PatternRec';
import TypingSpeed from '../components/games/TypingSpeed';
import OddOneOut from '../components/games/OddOneOut';

const GAME_COMPONENTS = {
    speed_math: SpeedMath,
    trivia: Trivia,
    memory_grid: MemoryGrid,
    reaction_click: ReactionClick,
    logic_puzzle: LogicPuzzle,
    word_scramble: WordScramble,
    color_match: ColorMatch,
    pattern_rec: PatternRec,
    typing_speed: TypingSpeed,
    odd_one_out: OddOneOut,
};

export default function GameRoom() {
    const navigate = useNavigate();
    const socket = useSocket();
    const { room, currentRound, setCurrentRound, setRoom, profile } = useGame();

    const [timeLeft, setTimeLeft] = useState(0);
    const [scores, setScores] = useState([]);
    const [roundScore, setRoundScore] = useState(null);
    const [showScorePopup, setShowScorePopup] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        socket.on('game:round_start', (roundData) => {
            setCurrentRound(roundData);
            setRoundScore(null);
            setTimeLeft(roundData.duration);
        });

        socket.on('room:scores_updated', ({ players }) => {
            setScores(players);
        });

        socket.on('game:results', ({ players }) => {
            navigate('/results', { state: { players } });
        });

        return () => {
            socket.off('game:round_start');
            socket.off('room:scores_updated');
            socket.off('game:results');
        };
    }, [socket]);

    // Timer
    useEffect(() => {
        if (!currentRound) return;
        setTimeLeft(currentRound.duration);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timerRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [currentRound?.roundIndex]);

    function submitScore(points) {
        if (roundScore !== null) return;
        setRoundScore(points);
        setShowScorePopup(true);
        setTimeout(() => setShowScorePopup(false), 1500);
        socket.emit('game:submit_score', { roomCode: room.code, points });
    }

    if (!currentRound) return (
        <div className="page">
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 64 }} className="animate-float">🎮</div>
                <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>جاري تحميل اللعبة...</p>
            </div>
        </div>
    );

    const GameComponent = GAME_COMPONENTS[currentRound.gameId];
    const progress = (timeLeft / currentRound.duration) * 100;
    const timerColor = timeLeft > 10 ? 'var(--success)' : timeLeft > 5 ? 'var(--accent)' : 'var(--danger)';

    return (
        <div className="game-container">
            {/* Header */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                        <span className="badge badge-primary">
                            جولة {currentRound.roundIndex + 1} / {currentRound.totalRounds}
                        </span>
                    </div>
                    <div style={{
                        fontSize: 32, fontWeight: 900, color: timerColor,
                        transition: 'color 0.3s',
                        textShadow: timeLeft <= 5 ? `0 0 20px ${timerColor}` : 'none',
                    }}>
                        {timeLeft}s
                    </div>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${timerColor}, var(--secondary))` }} />
                </div>
            </div>

            {/* Score popup */}
            <AnimatePresence>
                {showScorePopup && roundScore !== null && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0, y: 0 }}
                        animate={{ scale: 1, opacity: 1, y: -50 }}
                        exit={{ scale: 0, opacity: 0, y: -100 }}
                        className="score-popup"
                        style={{ color: roundScore > 0 ? 'var(--success)' : 'var(--danger)' }}
                    >
                        {roundScore > 0 ? `+${roundScore}` : roundScore}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game */}
            <div style={{ flex: 1 }}>
                {GameComponent && (
                    <GameComponent
                        roundData={currentRound.roundData}
                        timeLeft={timeLeft}
                        duration={currentRound.duration}
                        onScore={submitScore}
                        submitted={roundScore !== null}
                    />
                )}
            </div>

            {/* Live scores */}
            {scores.length > 0 && (
                <div className="card" style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>🏆 الترتيب الحالي</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[...scores].sort((a, b) => b.score - a.score).slice(0, 5).map((p, i) => (
                            <div key={p.id} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '4px 10px', borderRadius: 999,
                                background: i === 0 ? 'rgba(245,158,11,0.2)' : 'var(--surface)',
                                border: `1px solid ${i === 0 ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                                fontSize: 13,
                            }}>
                                <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
                                <span style={{ fontWeight: 700 }}>{p.name}</span>
                                <span style={{ color: 'var(--text-muted)' }}>{p.score}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
