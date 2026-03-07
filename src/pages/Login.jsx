import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

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
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2b7ab9] via-[#3498db] to-[#4caf50] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 hero-grid opacity-20"></div>
        
        {/* Animated Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="hero-blob w-96 h-96 bg-white/10 top-20 -left-20 animate-blob"></div>
          <div className="hero-blob w-80 h-80 bg-white/10 bottom-20 right-10 animate-blob animation-delay-200"></div>
        </div>

        <div className="relative flex flex-col justify-center p-12 lg:p-16 text-white">
          {/* Logo */}
          <Link to="/" className="mb-12 group">
            <img 
              src="/aidoccall-logo.png" 
              alt="AidocCall" 
              className="h-12 w-auto object-contain brightness-0 invert group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Tagline */}
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
            Welcome back to<br />
            <span className="text-blue-200">better healthcare</span>
          </h1>
          <p className="text-lg text-blue-100 mb-10 max-w-md">
            Sign in to access your appointments, health records, and connect with your healthcare providers.
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="material-icons text-sm">verified_user</span>
              <span className="text-sm font-medium">HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="material-icons text-sm">lock</span>
              <span className="text-sm font-medium">256-bit Encrypted</span>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 flex gap-8">
            <div>
              <p className="text-3xl font-bold">10K+</p>
              <p className="text-blue-200 text-sm">Active Users</p>
            </div>
            <div>
              <p className="text-3xl font-bold">500+</p>
              <p className="text-blue-200 text-sm">Verified Doctors</p>
            </div>
            <div>
              <p className="text-3xl font-bold">4.9</p>
              <p className="text-blue-200 text-sm">User Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-[#2b7ab9] to-[#4caf50] px-6 py-8 text-white">
          <Link to="/" className="mb-4 inline-block">
            <img 
              src="/aidoccall-logo.png" 
              alt="AidocCall" 
              className="h-10 w-auto object-contain brightness-0 invert"
            />
          </Link>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-blue-100 text-sm">Sign in to continue</p>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-gray-50 lg:bg-white">
          <div className="w-full max-w-md">
            {/* Desktop Header */}
            <div className="hidden lg:block mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
              <p className="text-gray-500">Enter your credentials to access your account</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-fadeInDown">
                <span className="material-icons text-red-500 mt-0.5">error_outline</span>
                <div>
                  <p className="font-medium text-red-800">Login Failed</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons text-gray-400">
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons text-gray-400">
                    lock
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-icons">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 transition-colors"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Remember me</span>
                </label>
                <button 
                  type="button" 
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white font-semibold rounded-2xl hover:from-[#236394] hover:to-[#1a4b6f] focus:outline-none focus:ring-4 focus:ring-[#2b7ab9]/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#2b7ab9]/25 hover:shadow-xl hover:shadow-[#2b7ab9]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="spinner spinner-sm border-white border-t-transparent"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="material-icons">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            {/* Register Link */}
            <p className="mt-8 text-center text-gray-600">
              Don't have an account?{' '}
              <Link to="/patient/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Create Account
              </Link>
            </p>

            {/* Security Badge */}
            <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
              <span className="material-icons text-sm">security</span>
              <span className="text-xs">Secured by 256-bit SSL encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
