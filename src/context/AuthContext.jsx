import { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);       // Firebase user
    const [playerData, setPlayerData] = useState(null); // Firestore player doc
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await loadPlayerData(firebaseUser.uid);
            } else {
                setPlayerData(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    async function loadPlayerData(uid) {
        const ref = doc(db, 'players', uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            setPlayerData(snap.data());
        }
        return snap.data();
    }

    async function registerWithEmail(email, password, name, avatarUrl, color) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name, photoURL: avatarUrl || null });
        const data = createInitialPlayerData(cred.user.uid, name, avatarUrl, color);
        await setDoc(doc(db, 'players', cred.user.uid), data);
        setPlayerData(data);
        return cred.user;
    }

    async function loginWithEmail(email, password) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await loadPlayerData(cred.user.uid);
        return cred.user;
    }

    async function loginWithGoogle() {
        const cred = await signInWithPopup(auth, googleProvider);
        const ref = doc(db, 'players', cred.user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            const data = createInitialPlayerData(
                cred.user.uid,
                cred.user.displayName,
                cred.user.photoURL,
                '#7c3aed'
            );
            await setDoc(ref, data);
            setPlayerData(data);
        } else {
            setPlayerData(snap.data());
        }
        return cred.user;
    }

    async function logout() {
        await signOut(auth);
        setPlayerData(null);
    }

    async function updatePlayerData(uid, updates) {
        const ref = doc(db, 'players', uid);
        await setDoc(ref, updates, { merge: true });
        setPlayerData(prev => ({ ...prev, ...updates }));
    }

    // مشتق: هل المستخدم الحالي أدمن؟
    const isAdmin = !!playerData?.isAdmin;

    return (
        <AuthContext.Provider value={{
            user, playerData, loading, isAdmin,
            registerWithEmail, loginWithEmail, loginWithGoogle, logout,
            loadPlayerData, updatePlayerData,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

// ── helpers ──────────────────────────────────────────────
function createInitialPlayerData(uid, name, avatarUrl, color) {
    return {
        uid,
        name: name || 'لاعب',
        avatarUrl: avatarUrl || null,
        color: color || '#7c3aed',
        // Stats
        coins: 1000,
        level: 1,
        xp: 0,
        totalMatches: 0,
        firstPlaceCount: 0,
        secondPlaceCount: 0,
        thirdPlaceCount: 0,
        totalScore: 0,
        // Social
        following: [],
        followers: [],
        // Season
        seasonXp: 0,
        // Meta
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
}

/** حساب اللفل من الـ XP */
export function calcLevel(xp) {
    // كل لفل يحتاج 100 xp إضافية (لفل 1=100, 2=200, ...)
    let level = 1;
    let needed = 100;
    let remaining = xp;
    while (remaining >= needed && level < 100) {
        remaining -= needed;
        level++;
        needed += 50;
    }
    return { level, xpInLevel: remaining, xpNeeded: needed };
}

/** إطار الصورة بحسب اللفل */
export function getFrame(level) {
    if (level >= 80) return { label: 'أسطوري', color: '#f59e0b', glow: '#f59e0b80', icon: '🔱' };
    if (level >= 50) return { label: 'متقدم', color: '#a855f7', glow: '#a855f780', icon: '💎' };
    if (level >= 20) return { label: 'متوسط', color: '#06b6d4', glow: '#06b6d480', icon: '⚡' };
    return { label: 'مبتدئ', color: '#64748b', glow: '#64748b80', icon: '🌱' };
}

/** XP يُكتسب من نهاية مباراة */
export function calcMatchXP(rank, totalPlayers, score) {
    const rankBonus = rank === 1 ? 100 : rank === 2 ? 60 : rank === 3 ? 40 : 20;
    const scoreBonus = Math.floor(score / 10);
    return rankBonus + scoreBonus;
}
