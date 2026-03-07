import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { createPatientProfile, getPatientProfile } from '../../services/patientService';

const PatientRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: credentials, 2: residency

  // Account Data
  const [accountData, setAccountData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    isIndianResident: null
  });

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 4) return { score, label: 'Good', color: 'bg-emerald-500' };
    return { score, label: 'Strong', color: 'bg-emerald-600' };
  };

  const passwordStrength = getPasswordStrength(accountData.password);

  const validateStep1 = () => {
    setError('');
    if (!accountData.fullName?.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!accountData.email) {
      setError('Please enter your email address');
      return false;
    }
    if (!accountData.password || accountData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (accountData.password !== accountData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (accountData.isIndianResident === null) {
      setError('Please indicate if you are a resident of India');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let userId = null;
      let session = null;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: accountData.email,
        password: accountData.password,
        options: {
          data: { role: 'patient' }
        }
      });

      if (authError) {
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

      await new Promise(resolve => setTimeout(resolve, 300));

      let existingProfile = null;
      try {
        existingProfile = await getPatientProfile(userId);
      } catch (profileCheckErr) {
        console.log('Profile check skipped:', profileCheckErr.message);
      }

      if (existingProfile) {
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
        await createPatientProfile(userId, {
          email: accountData.email,
          fullName: accountData.fullName.trim(),
          isIndianResident: accountData.isIndianResident
        });
      }

      if (accountData.isIndianResident) {
        navigate('/dashboard');
      } else {
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
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2b7ab9] via-[#3498db] to-[#4caf50] relative overflow-hidden">
        <div className="absolute inset-0 hero-grid opacity-20"></div>
        
        <div className="absolute inset-0 overflow-hidden">
          <div className="hero-blob w-96 h-96 bg-white/10 top-20 -left-20 animate-blob"></div>
          <div className="hero-blob w-80 h-80 bg-white/10 bottom-20 right-10 animate-blob animation-delay-200"></div>
        </div>

        <div className="relative flex flex-col justify-center p-12 lg:p-16 text-white">
          <Link to="/" className="mb-12 group">
            <img 
              src="/aidoccall-logo.png" 
              alt="AidocCall" 
              className="h-12 w-auto object-contain brightness-0 invert group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
            Start your<br />
            <span className="text-blue-200">health journey</span>
          </h1>
          <p className="text-lg text-blue-100 mb-10 max-w-md">
            Create your account in minutes and get instant access to verified healthcare professionals.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              { icon: 'verified_user', text: 'Access to 500+ verified doctors' },
              { icon: 'videocam', text: 'HD video consultations' },
              { icon: 'folder_shared', text: 'Secure health records' },
              { icon: 'schedule', text: '24/7 booking availability' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-sm">{item.icon}</span>
                </div>
                <span className="text-blue-100">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
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
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-blue-100 text-sm">Join AidocCall today</p>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-gray-50 lg:bg-white">
          <div className="w-full max-w-md">
            {/* Desktop Header */}
            <div className="hidden lg:block mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-gray-500">Fill in your details to get started</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-3 mb-8">
              <div className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-[#2b7ab9]' : 'bg-gray-200'}`}></div>
              <div className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-[#4caf50]' : 'bg-gray-200'}`}></div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-fadeInDown">
                <span className="material-icons text-red-500 mt-0.5">error_outline</span>
                <div>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Step 1: Account Details */}
              {step === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons text-gray-400">person</span>
                      <input
                        type="text"
                        value={accountData.fullName}
                        onChange={(e) => setAccountData({ ...accountData, fullName: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons text-gray-400">mail</span>
                      <input
                        type="email"
                        value={accountData.email}
                        onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons text-gray-400">lock</span>
                      <input
                        type="password"
                        value={accountData.password}
                        onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                        placeholder="Min 6 characters"
                        required
                      />
                    </div>
                    {/* Password Strength */}
                    {accountData.password && (
                      <div className="mt-3 animate-fadeIn">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${passwordStrength.color} transition-all duration-300`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-medium ${
                            passwordStrength.score <= 2 ? 'text-red-500' : 
                            passwordStrength.score <= 3 ? 'text-amber-500' : 'text-emerald-500'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Use 8+ characters with uppercase, numbers & symbols for stronger security
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons text-gray-400">lock</span>
                      <input
                        type="password"
                        value={accountData.confirmPassword}
                        onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                        className={`w-full pl-12 pr-12 py-4 bg-white border-2 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 transition-all duration-200 ${
                          accountData.confirmPassword && accountData.confirmPassword !== accountData.password
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                            : accountData.confirmPassword && accountData.confirmPassword === accountData.password
                            ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/10'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/10'
                        }`}
                        placeholder="Confirm your password"
                        required
                      />
                      {accountData.confirmPassword && (
                        <span className={`absolute right-4 top-1/2 -translate-y-1/2 material-icons ${
                          accountData.confirmPassword === accountData.password ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          {accountData.confirmPassword === accountData.password ? 'check_circle' : 'cancel'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Continue Button */}
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full py-4 px-6 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white font-semibold rounded-2xl hover:from-[#236394] hover:to-[#1a4b6f] focus:outline-none focus:ring-4 focus:ring-[#2b7ab9]/30 shadow-lg shadow-[#2b7ab9]/25 hover:shadow-xl hover:shadow-[#2b7ab9]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    Continue
                    <span className="material-icons">arrow_forward</span>
                  </button>
                </div>
              )}

              {/* Step 2: Residency */}
              {step === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    <span className="material-icons text-lg">arrow_back</span>
                    Back
                  </button>

                  {/* Residency Question */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Almost there, {accountData.fullName.split(' ')[0]}!</h3>
                    <p className="text-gray-500 mb-6">One quick question to personalize your experience</p>
                    
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Are you a resident of India?
                    </label>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setAccountData({ ...accountData, isIndianResident: true })}
                        className={`p-6 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-3 ${
                          accountData.isIndianResident === true
                            ? 'border-[#2b7ab9] bg-[#e8f4fc] shadow-lg shadow-[#2b7ab9]/20'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          accountData.isIndianResident === true
                            ? 'bg-[#2b7ab9] text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <span className="material-icons text-2xl">check</span>
                        </div>
                        <span className={`font-semibold ${
                          accountData.isIndianResident === true ? 'text-[#2b7ab9]' : 'text-gray-700'
                        }`}>Yes, I am</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setAccountData({ ...accountData, isIndianResident: false })}
                        className={`p-6 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-3 ${
                          accountData.isIndianResident === false
                            ? 'border-gray-700 bg-gray-50 shadow-lg shadow-gray-500/20'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          accountData.isIndianResident === false
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <span className="material-icons text-2xl">public</span>
                        </div>
                        <span className={`font-semibold ${
                          accountData.isIndianResident === false ? 'text-gray-800' : 'text-gray-700'
                        }`}>No, I'm not</span>
                      </button>
                    </div>

                    {accountData.isIndianResident === false && (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 animate-fadeIn">
                        <span className="material-icons text-amber-500 mt-0.5">info</span>
                        <p className="text-sm text-amber-800">
                          International patients are welcome! You'll need to complete a brief verification process and consent form.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || accountData.isIndianResident === null}
                    className="w-full py-4 px-6 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white font-semibold rounded-2xl hover:from-[#236394] hover:to-[#1a4b6f] focus:outline-none focus:ring-4 focus:ring-[#2b7ab9]/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#2b7ab9]/25 hover:shadow-xl hover:shadow-[#2b7ab9]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="spinner spinner-sm border-white border-t-transparent"></div>
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <span className="material-icons">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>

            {/* Terms */}
            <p className="mt-6 text-xs text-gray-500 text-center">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
            </p>

            {/* Login Link */}
            <p className="mt-6 text-center text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Sign In
              </Link>
            </p>

            {/* Security Badge */}
            <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
              <span className="material-icons text-sm">security</span>
              <span className="text-xs">Your data is protected with 256-bit encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientRegister;
