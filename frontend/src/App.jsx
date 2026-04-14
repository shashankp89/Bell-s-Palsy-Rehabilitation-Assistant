import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';

function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard', 'exercise'
  const [historyData, setHistoryData] = useState([]);

  // Fetch data dynamically on mount or specific events
  const loadData = async () => {
    try {
      // Append timestamp to bypass caching
      const res = await fetch('/recovery_history.json?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600 tracking-tight">SymmeTrack</h1>
          <p className="text-xs text-gray-500 font-medium">Bell's Palsy Rehabilitation</p>
        </div>
        <button 
          onClick={() => {
            if (view === 'dashboard') {
              setView('exercise');
              fetch('/api/start-exercise')
                .then(res => res.json())
                .then(data => console.log(data))
                .catch(err => console.error('Failed to start python script', err));
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
      </header>

      <main className="flex-1 p-6">
        {view === 'exercise' ? (
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow border border-gray-100 text-center animate-fade-in">
            <h2 className="text-3xl font-bold mb-2">Live Exercise Session</h2>
            <p className="text-gray-500 mb-8">Follow the instructions in the active Python application window.</p>
            
            <div className="bg-black rounded-xl aspect-video flex flex-col items-center justify-center mb-8 border-4 border-gray-800 shadow-inner">
               <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
               <p className="text-emerald-400 font-medium text-lg tracking-wide">Syncing Facial Landmarks via AI System...</p>
               <p className="text-gray-400 text-sm mt-2">Data will be pushed to the dashboard automatically.</p>
            </div>
            
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => {
                  loadData(); // Pull fresh data from the updated JSON
                  setView('dashboard');
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-md transition-transform hover:scale-105"
              >
                Finish Session & View Results
              </button>
            </div>
          </div>
        ) : (
          <Dashboard rawData={historyData} onRefresh={loadData} />
        )}
      </main>
    </div>
  );
}

export default App;
