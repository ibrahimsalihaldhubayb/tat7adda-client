// 🔥 Firebase Config
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAxKFAPBeIyFgKKh7NDICujCLPNMccWukg",
    authDomain: "tat7adda.firebaseapp.com",
    projectId: "tat7adda",
    storageBucket: "tat7adda.firebasestorage.app",
    messagingSenderId: "461561636794",
    appId: "1:461561636794:web:8f9219bb89fd38eac45f83",
    measurementId: "G-1M4KNJXHVS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

