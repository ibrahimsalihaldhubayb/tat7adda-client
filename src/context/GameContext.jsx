import { createContext, useContext, useState } from 'react';

const GameContext = createContext(null);

export function GameProvider({ children }) {
    const [profile, setProfile] = useState(null); // { name, avatar }
    const [room, setRoom] = useState(null);
    const [gameList, setGameList] = useState([]);
    const [currentRound, setCurrentRound] = useState(null);
    const [scores, setScores] = useState([]);

    return (
        <GameContext.Provider value={{
            profile, setProfile,
            room, setRoom,
            gameList, setGameList,
            currentRound, setCurrentRound,
            scores, setScores,
        }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    return useContext(GameContext);
}
