import { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import BrowserExercise from './BrowserExercise';
import LoginPage from './LoginPage';
import { seededDashboardData } from './data';
import {
  signInWithGoogle,
  signInWithEmailPassword,
  signInAsAdmin,
  createGuestSession,
  saveSession,
  restoreSession,
  clearSession,
  loadUserSessions,
  saveUserSession,
} from './auth';

function App() {
  const [session, setSession] = useState(() => restoreSession());
  const [view, setView] = useState('dashboard');
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async (activeSession = session) => {
    try {
      const res = await fetch('/recovery_history.json?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        const localData = activeSession
          ? JSON.parse(localStorage.getItem(`symmetrack-history-${activeSession.uid}`) || '[]')
          : [];
        const cloudData = activeSession?.role === 'user' ? await loadUserSessions(activeSession.uid) : [];
        const persistedData = cloudData.length ? cloudData : localData;
        setHistoryData([...(Array.isArray(data) && data.length ? data : seededDashboardData), ...persistedData]);
        return;
      }
      setHistoryData(seededDashboardData);
    } catch (err) {
      console.error('Failed to fetch history', err);
      const localData = activeSession
        ? JSON.parse(localStorage.getItem(`symmetrack-history-${activeSession.uid}`) || '[]')
        : [];
      setHistoryData([...seededDashboardData, ...localData]);
    }
  }, [session]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completeLogin = (user) => {
    setSession(user);
    saveSession(user);
    setError('');
    setView('dashboard');
    loadData(user);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const user = await signInWithGoogle();
      completeLogin(user);
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (email, password) => {
    try {
      setLoading(true);
      setError('');
      const user = await signInWithEmailPassword(email, password);
      completeLogin(user);
    } catch (err) {
      setError(err.message || 'Email login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (email, password) => {
    try {
      setLoading(true);
      setError('');
      const user = await signInAsAdmin(email, password);
      completeLogin(user);
    } catch (err) {
      setError(err.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guest = createGuestSession();
    completeLogin(guest);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setView('dashboard');
  };

  const handleExerciseComplete = async (scores) => {
    const record = {
      date: new Date().toISOString().replace('T', ' ').slice(0, 19),
      scores,
    };
    const storageKey = `symmetrack-history-${session.uid}`;
    const previous = JSON.parse(localStorage.getItem(storageKey) || '[]');
    localStorage.setItem(storageKey, JSON.stringify([...previous, record]));
    await saveUserSession(session.uid, record).catch((err) => console.error('Cloud session save failed', err));
    setHistoryData((current) => [...current, record]);
    setView('dashboard');
  };

  const canAccessExercise = session && (session.role === 'user' || session.role === 'guest');

  if (!session) {
    return (
      <LoginPage
        onGoogleLogin={handleGoogleLogin}
        onEmailLogin={handleEmailLogin}
        onAdminLogin={handleAdminLogin}
        onGuestLogin={handleGuestLogin}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600 tracking-tight">SymmeTrack</h1>
          <p className="text-xs text-gray-500 font-medium">
            {session.role === 'admin' ? 'Recruiter Preview' : session.role === 'guest' ? 'Visitor Preview' : 'Bell\'s Palsy Rehabilitation'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {session.displayName && (
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-700 border border-gray-200">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold">
                {session.displayName.charAt(0).toUpperCase()}
              </span>
              <span>{session.displayName}</span>
            </div>
          )}

          {canAccessExercise && (
            <button
              onClick={() => {
                if (view === 'dashboard') {
                  setView('exercise');
                } else {
                  loadData();
                  setView('dashboard');
                }
              }}
              className={`px-5 py-2.5 rounded-lg font-bold transition-all shadow-sm ${
                view === 'dashboard'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}
            >
              {view === 'dashboard' ? 'Start Live Exercise' : 'Exit Session'}
            </button>
          )}

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-lg font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          >
            {session.role === 'guest' || session.role === 'admin' ? 'Back to Login' : 'Logout'}
          </button>
        </div>
      </header>

      <main className="flex-1 p-6">
        {view === 'exercise' && canAccessExercise ? (
          <BrowserExercise
            onComplete={handleExerciseComplete}
            onCancel={() => {
              loadData();
              setView('dashboard');
            }}
          />
        ) : (
          <Dashboard rawData={historyData} onRefresh={loadData} />
        )}
      </main>
    </div>
  );
}

export default App;
