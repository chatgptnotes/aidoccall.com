import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Logo/Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="material-icons text-white text-3xl">local_hospital</span>
          </div>
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-gray-500 mb-8">Sign in to AidocCall</p>

        {/* Login Card */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
              <span className="material-icons text-red-500 mr-2">error_outline</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-icons text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 text-white py-3 px-4 rounded-xl hover:bg-teal-600 transition-all duration-200 font-semibold disabled:bg-teal-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <span className="material-icons animate-spin mr-2">refresh</span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span className="material-icons ml-2">login</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Create Account Link */}
        <p className="mt-6 text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/patient/register')}
            className="text-teal-600 hover:text-teal-700 font-semibold transition-colors"
          >
            Create New Account
          </button>
        </p>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-xs text-gray-400">v1.3 - 2026-01-17</p>
      </footer>
    </div>
  );
};

export default Login;
