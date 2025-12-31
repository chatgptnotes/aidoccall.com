import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userRole, setUserRole] = useState('patient'); // Default role for registration
  const navigate = useNavigate();
  const { signIn, signUp, fetchUserProfile } = useAuth();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegisterMode) {
        // Registration with role
        await signUp(email, password, { 
          name: fullName,
          role: userRole 
        });
        setSuccess(`${userRole === 'telecaller' ? 'Telecaller' : 'Patient'} account created successfully! You can now login.`);
        setIsRegisterMode(false);
        setEmail('');
        setPassword('');
        setFullName('');
        setUserRole('patient'); // Reset to default
      } else {
        // Login
        const loginResult = await signIn(email, password);
        
        // Wait a moment for the AuthContext to update the user profile
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      }
    } catch (error) {
      setError(error.message || (isRegisterMode ? 'Registration failed. Please try again.' : 'Invalid credentials. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          {isRegisterMode ? 'Create New Account' : 'AidocCall Login'}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegisterMode && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="userRole">
                  Account Type
                </label>
                <select
                  id="userRole"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="patient">Patient - Book consultations and manage health records</option>
                  <option value="telecaller">Telecaller - Coordinate medical consultations</option>
                </select>
              </div>
            </>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@gmail.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus:text-blue-500 transition-colors duration-200"
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-icons text-lg select-none">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? (isRegisterMode ? 'Creating Account...' : 'Logging in...') : (isRegisterMode ? 'Create Account' : 'Login')}
          </button>
        </form>

        <div className="mt-4 text-center space-y-3">
          <button
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError('');
              setSuccess('');
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-semibold block w-full"
          >
            {isRegisterMode ? '← Back to Login' : 'Create New Account →'}
          </button>
        </div>

        {!isRegisterMode && (
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold mb-2 text-gray-800">Demo Credentials:</h3>
                <div className="text-left space-y-2">
                  <div>
                    <span className="font-medium">Admin:</span>
                    <br />
                    <span className="text-xs text-gray-500">Email: admin@raftaar.com | Password: admin123</span>
                  </div>
                  <div>
                    <span className="font-medium">Telecaller:</span>
                    <br />
                    <span className="text-xs text-gray-500">Email: telecaller@raftaar.com | Password: tele123</span>
                  </div>
                  <div>
                    <span className="font-medium">Patient:</span>
                    <br />
                    <span className="text-xs text-gray-500">Email: patient@raftaar.com | Password: patient123</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
