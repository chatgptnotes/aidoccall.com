import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { getPatientProfile } from '../../services/patientService';

const InternationalConsentForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [patientId, setPatientId] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPatientData();
  }, [user]);

  const loadPatientData = async () => {
    if (!user?.id) {
      navigate('/login');
      return;
    }

    try {
      const profile = await getPatientProfile(user.id);
      if (profile) {
        setPatientId(profile.id);
        
        // Already completed consent? Go to dashboard
        if (profile.international_consent_completed) {
          navigate('/dashboard');
          return;
        }
      } else {
        navigate('/patient/register');
        return;
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!agreed) {
      setError('Please agree to the terms to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('doc_patients')
        .update({
          international_consent_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (updateError) throw updateError;

      navigate('/dashboard');
    } catch (err) {
      console.error('Consent error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-white text-3xl">public</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">International Patient Consent</h1>
          <p className="text-gray-600 mt-2">Please read and agree to continue</p>
        </div>

        {/* Consent Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <span className="material-icons text-sm align-middle mr-2">error</span>
              {error}
            </div>
          )}

          {/* Terms Content */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6 max-h-96 overflow-y-auto">
            <h2 className="font-bold text-gray-800 mb-4">Terms & Conditions for International Patients</h2>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">1. Telemedicine Services</h3>
                <p>You will be receiving healthcare services through telemedicine technology (video/audio consultation). This is different from an in-person medical visit.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-1">2. Limitations</h3>
                <p>Telemedicine has limitations, including potential technical difficulties. The physician may not be able to provide a diagnosis or treatment without a physical examination.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-1">3. Medical Advice</h3>
                <p>Medical advice provided is based on information you share. You consent to receive consultation from healthcare providers registered in India.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-1">4. Payment Terms</h3>
                <p>All payments are in Indian Rupees (INR). You accept responsibility for any currency conversion fees or international transaction charges.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-1">5. Data Privacy</h3>
                <p>Your personal and health data will be collected, stored, and processed in accordance with Indian data protection laws and our privacy policy.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-1">6. Jurisdiction</h3>
                <p>Any disputes will be governed by Indian law and courts in India shall have exclusive jurisdiction.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-1">7. Emergency</h3>
                <p>This service is not for emergencies. In case of emergency, contact local emergency services immediately.</p>
              </div>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer mb-6 p-4 bg-indigo-50 rounded-xl border-2 border-indigo-200">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-gray-800">
              <strong>I have read, understood, and agree</strong> to all the terms and conditions stated above. I consent to receive telemedicine services from AidocCall.
            </span>
          </label>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !agreed}
            className={`w-full px-8 py-4 rounded-xl font-semibold transition shadow-lg ${
              agreed 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/25' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : (
              <>
                <span className="material-icons text-sm align-middle mr-2">check_circle</span>
                I Agree - Continue
              </>
            )}
          </button>

          {/* Back Link */}
          <p className="text-center mt-4 text-sm text-gray-500">
            Changed your mind?{' '}
            <button 
              onClick={() => navigate('/patient/register')} 
              className="text-indigo-600 hover:underline"
            >
              Go back to registration
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InternationalConsentForm;
