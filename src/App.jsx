import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { GameProvider } from './context/GameContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProfileSetup from './pages/ProfileSetup';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';
import Results from './pages/Results';
import AuthPage from './pages/AuthPage';
import Profile from './pages/Profile';
import Shop from './pages/Shop';
import QuestionsEditor from './pages/QuestionsEditor';
import AdminPanel from './pages/AdminPanel';
import './index.css';

// ─── يحمي المسارات التي تحتاج تسجيل دخول ────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page"><div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>⏳ جاري التحميل...</div></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

// ─── يحمي المسارات التي تحتاج صلاحية أدمن ───────────────
function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="page"><div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>⏳ جاري التحميل...</div></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;   // غير أدمن → الرئيسية
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <GameProvider>
          <BrowserRouter>
            <Routes>
              {/* Auth */}
              <Route path="/auth" element={<AuthPage />} />

              {/* Game (محمية بتسجيل الدخول) */}
              <Route path="/" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
              <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
              <Route path="/game" element={<ProtectedRoute><GameRoom /></ProtectedRoute>} />
              <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />

              {/* Admin فقط (isAdmin = true في Firestore) */}
              <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
              <Route path="/questions" element={<AdminRoute><QuestionsEditor /></AdminRoute>} />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </GameProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
