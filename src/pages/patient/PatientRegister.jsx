import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { createPatientProfile, getPatientProfile } from '../../services/patientService';

const PatientRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Account Data
  const [accountData, setAccountData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    isIndianResident: null // null = not selected, true = yes, false = no
  });

  const validateForm = () => {
    setError('');

    if (!accountData.fullName || !accountData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!accountData.email || !accountData.password) {
      setError('Email and password are required');
      return false;
    }
    if (accountData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (accountData.password !== accountData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (accountData.isIndianResident === null) {
      setError('Please indicate if you are a resident of India');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      let userId = null;
      let session = null;

      // Try to create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: accountData.email,
        password: accountData.password,
        options: {
          data: {
            role: 'patient'
          }
        }
      });

      if (authError) {
        // If user already exists (from a previous failed attempt), try signing in
        if (authError.message?.toLowerCase().includes('already registered') ||
            authError.message?.toLowerCase().includes('already been registered') ||
            authError.message?.toLowerCase().includes('user already')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: accountData.email,
            password: accountData.password
          });

          if (signInError) throw signInError;
          session = signInData.session;
          userId = signInData.user?.id;
        } else {
          throw authError;
        }
      } else {
        userId = authData.user?.id;
        session = authData.session;

        // If no session returned, try to sign in immediately
        if (!session && userId) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: accountData.email,
            password: accountData.password
          });

          if (signInError) {
            setError('Account created! Please check your email to confirm, then sign in.');
            setLoading(false);
            return;
          }

          session = signInData.session;
          userId = signInData.user?.id;
        }
      }

      if (!userId) {
        throw new Error('Failed to create account. Please try again.');
      }

      // Wait a moment for session to propagate
      await new Promise(resolve => setTimeout(resolve, 300));

      // Check if patient profile already exists (from a previous failed attempt)
      let existingProfile = null;
      try {
        existingProfile = await getPatientProfile(userId);
      } catch (profileCheckErr) {
        // Ignore errors checking for existing profile (e.g., RLS 406)
        console.log('Profile check skipped:', profileCheckErr.message);
      }

      if (existingProfile) {
        // Update with India resident status and name
        const nameParts = accountData.fullName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';
        
        await supabase
          .from('doc_patients')
          .update({
            first_name: firstName,
            last_name: lastName,
            is_indian_resident: accountData.isIndianResident,
            registration_step: 1
          })
          .eq('id', existingProfile.id);
      } else {
        // Create patient profile with India resident status
        await createPatientProfile(userId, {
          email: accountData.email,
          fullName: accountData.fullName.trim(),
          isIndianResident: accountData.isIndianResident
        });
      }

      // Redirect based on India resident status
      if (accountData.isIndianResident) {
        // Indian residents go directly to dashboard
        navigate('/dashboard');
      } else {
        // International patients must fill consent form first
        navigate('/patient/international-consent');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-white text-3xl">local_hospital</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-600 mt-2">Join AidocCall for seamless healthcare</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                <span className="material-icons text-sm align-middle mr-2">error</span>
                {error}
              </div>
            )}

            <div className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={accountData.fullName}
                  onChange={(e) => setAccountData({ ...accountData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={accountData.email}
                  onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={accountData.password}
                  onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min 6 characters"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={accountData.confirmPassword}
                  onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              {/* India Resident Question */}
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Are you a resident of India? *
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setAccountData({ ...accountData, isIndianResident: true })}
                    className={`flex-1 px-5 py-3 rounded-lg text-sm font-medium border-2 transition-all ${
                      accountData.isIndianResident === true
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    <span className="material-icons text-sm align-middle mr-2">check_circle</span>
                    Yes, I am
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountData({ ...accountData, isIndianResident: false })}
                    className={`flex-1 px-5 py-3 rounded-lg text-sm font-medium border-2 transition-all ${
                      accountData.isIndianResident === false
                        ? 'bg-gray-600 text-white border-gray-600 shadow-lg shadow-gray-500/25'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <span className="material-icons text-sm align-middle mr-2">cancel</span>
                    No, I'm not
                  </button>
                </div>
                {accountData.isIndianResident === false && (
                  <p className="mt-3 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                    <span className="material-icons text-sm align-middle mr-1">info</span>
                    International patients are welcome! Additional verification may be required.
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 shadow-lg shadow-blue-500/25"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating Account...
                </span>
              ) : (
                <>
                  Create Account
                  <span className="material-icons text-sm align-middle ml-2">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-6 text-xs text-gray-500 text-center">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400">
          Secure registration powered by AidocCall
        </div>
      </div>
    </div>
  );
};

export default PatientRegister;
