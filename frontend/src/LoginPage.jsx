import { useState } from 'react';

export default function LoginPage({
  onGoogleLogin,
  onEmailLogin,
  onAdminLogin,
  onGuestLogin,
  loading,
  error,
}) {
  const [mode, setMode] = useState('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('admin@gmail.com');
  const [adminPassword, setAdminPassword] = useState('Admin@123');

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    onEmailLogin(email, password);
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    onAdminLogin(adminEmail, adminPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 text-2xl font-bold mb-4">
            S
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SymmeTrack</h1>
          <p className="text-sm text-gray-500 mt-2">Bell's Palsy Recovery Portal</p>
        </div>

        <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
          {['google', 'email', 'admin'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                mode === item ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              {item === 'google' ? 'Google' : item === 'email' ? 'Email Login' : 'Admin'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {mode === 'google' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={onGoogleLogin}
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <button
              type="button"
              onClick={onGuestLogin}
              className="w-full border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-3 rounded-xl transition"
            >
              View Preloaded Report as Visitor
            </button>
          </div>
        )}

        {mode === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.google.email@gmail.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Login with Email'}
            </button>
          </form>
        )}

        {mode === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
              required
            />
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
            >
              {loading ? 'Checking...' : 'Login as Admin'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
