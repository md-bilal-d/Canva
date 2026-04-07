import React, { useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login, loginWithGoogle, signUp, loading, user } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await login(email, password);
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Google login failed.');
    }
  };

  const handleGuestLogin = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const guestName = `Guest-${randomDigits}`;
    sessionStorage.setItem('isGuest', 'true');
    sessionStorage.setItem('guestName', guestName);
    sessionStorage.setItem('guestId', `guest-${randomDigits}`);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white font-sans w-full h-screen absolute inset-0 z-[100]">
      <div className="max-w-md w-full p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 mx-4">
        <h2 className="text-3xl font-bold text-center mb-8 tracking-tight">
          {isSignUp ? 'Create an account' : 'Welcome back'}
        </h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-medium flex justify-center items-center mt-6 shadow-lg shadow-indigo-600/20"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 mb-6 flex items-center justify-between">
          <hr className="w-full border-gray-700" />
          <span className="px-3 text-gray-500 text-sm font-medium uppercase min-w-max">or continue with</span>
          <hr className="w-full border-gray-700" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-gray-900 rounded-lg transition-colors font-medium flex justify-center items-center shadow-lg"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <button
          onClick={handleGuestLogin}
          disabled={loading}
          type="button"
          className="w-full mt-4 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium flex justify-center items-center shadow-lg"
        >
          Continue as Guest
        </button>

        <p className="mt-8 text-center text-sm text-gray-400">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-indigo-400 hover:text-indigo-300 font-medium ml-1 outline-none focus:underline"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}
