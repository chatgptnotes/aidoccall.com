import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { getPatientProfile } from '../../services/patientService';

const InternationalConsentForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [patientId, setPatientId] = useState(null);
  const [error, setError] = useState('');

  // Consent form data
  const [consentData, setConsentData] = useState({
    fullName: '',
    passportNumber: '',
    nationality: '',
    currentCountry: '',
    contactPhone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    
    // Consent checkboxes
    understandsTelemedicine: false,
    acceptsLimitations: false,
    consentsTreatment: false,
    acceptsPaymentTerms: false,
    acceptsDataProcessing: false,
    acceptsJurisdiction: false,
    
    // Digital signature
    digitalSignature: '',
    signatureDate: new Date().toISOString().split('T')[0]
  });

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
        
        // Check if already completed consent
        if (profile.international_consent_completed) {
          navigate('/dashboard');
          return;
        }

        // Pre-fill email if available
        if (profile.email) {
          setConsentData(prev => ({
            ...prev,
            fullName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
          }));
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

  const validateForm = () => {
    setError('');

    if (!consentData.fullName || !consentData.passportNumber || !consentData.nationality || !consentData.currentCountry) {
      setError('Please fill in all required personal information');
      return false;
    }

    if (!consentData.contactPhone) {
      setError('Please provide a contact phone number');
      return false;
    }

    if (!consentData.emergencyContactName || !consentData.emergencyContactPhone || !consentData.emergencyContactRelation) {
      setError('Please provide emergency contact details');
      return false;
    }

    if (!consentData.understandsTelemedicine || !consentData.acceptsLimitations || 
        !consentData.consentsTreatment || !consentData.acceptsPaymentTerms || 
        !consentData.acceptsDataProcessing || !consentData.acceptsJurisdiction) {
      setError('Please accept all consent terms to proceed');
      return false;
    }

    if (!consentData.digitalSignature) {
      setError('Please provide your digital signature (type your full name)');
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
      // Save consent form data to database
      const { error: updateError } = await supabase
        .from('doc_patients')
        .update({
          // Personal info
          passport_number: consentData.passportNumber,
          nationality: consentData.nationality,
          current_country: consentData.currentCountry,
          phone_number: consentData.contactPhone,
          
          // Emergency contact for international patients
          intl_emergency_contact_name: consentData.emergencyContactName,
          intl_emergency_contact_phone: consentData.emergencyContactPhone,
          intl_emergency_contact_relation: consentData.emergencyContactRelation,
          
          // Consent flags
          international_consent_completed: true,
          international_consent_date: new Date().toISOString(),
          international_consent_signature: consentData.digitalSignature,
          
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (updateError) throw updateError;

      // Also store the full consent record in a separate table for legal compliance
      const { error: consentError } = await supabase
        .from('doc_international_consents')
        .insert({
          patient_id: patientId,
          full_name: consentData.fullName,
          passport_number: consentData.passportNumber,
          nationality: consentData.nationality,
          current_country: consentData.currentCountry,
          contact_phone: consentData.contactPhone,
          emergency_contact_name: consentData.emergencyContactName,
          emergency_contact_phone: consentData.emergencyContactPhone,
          emergency_contact_relation: consentData.emergencyContactRelation,
          understands_telemedicine: consentData.understandsTelemedicine,
          accepts_limitations: consentData.acceptsLimitations,
          consents_treatment: consentData.consentsTreatment,
          accepts_payment_terms: consentData.acceptsPaymentTerms,
          accepts_data_processing: consentData.acceptsDataProcessing,
          accepts_jurisdiction: consentData.acceptsJurisdiction,
          digital_signature: consentData.digitalSignature,
          signature_date: consentData.signatureDate,
          ip_address: null, // Can be captured server-side
          user_agent: navigator.userAgent
        });

      // If consent table doesn't exist, just log and continue
      if (consentError && !consentError.message?.includes('does not exist')) {
        console.error('Consent record error:', consentError);
      }

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Consent form error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-white text-3xl">public</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">International Patient Consent Form</h1>
          <p className="text-gray-600 mt-2">Please complete this form before accessing our telemedicine services</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <span className="material-icons text-sm align-middle mr-2">error</span>
              {error}
            </div>
          )}

          {/* Section 1: Personal Information */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (as per passport) *</label>
                <input
                  type="text"
                  value={consentData.fullName}
                  onChange={(e) => setConsentData({ ...consentData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your full legal name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number *</label>
                <input
                  type="text"
                  value={consentData.passportNumber}
                  onChange={(e) => setConsentData({ ...consentData, passportNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. A12345678"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality *</label>
                <input
                  type="text"
                  value={consentData.nationality}
                  onChange={(e) => setConsentData({ ...consentData, nationality: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. United States"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Country of Residence *</label>
                <input
                  type="text"
                  value={consentData.currentCountry}
                  onChange={(e) => setConsentData({ ...consentData, currentCountry: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. United Kingdom"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone Number (with country code) *</label>
                <input
                  type="tel"
                  value={consentData.contactPhone}
                  onChange={(e) => setConsentData({ ...consentData, contactPhone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="+1 234 567 8900"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Emergency Contact */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
              Emergency Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                <input
                  type="text"
                  value={consentData.emergencyContactName}
                  onChange={(e) => setConsentData({ ...consentData, emergencyContactName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={consentData.emergencyContactPhone}
                  onChange={(e) => setConsentData({ ...consentData, emergencyContactPhone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="+1 234 567 8900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                <select
                  value={consentData.emergencyContactRelation}
                  onChange={(e) => setConsentData({ ...consentData, emergencyContactRelation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Consent & Acknowledgments */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
              Consent & Acknowledgments
            </h2>
            
            <div className="space-y-4 bg-gray-50 p-5 rounded-xl">
              {/* Telemedicine Understanding */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentData.understandsTelemedicine}
                  onChange={(e) => setConsentData({ ...consentData, understandsTelemedicine: e.target.checked })}
                  className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  <strong>Telemedicine Services:</strong> I understand that I will be receiving healthcare services through telemedicine technology (video/audio consultation) and that this is different from an in-person medical visit.
                </span>
              </label>

              {/* Limitations */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentData.acceptsLimitations}
                  onChange={(e) => setConsentData({ ...consentData, acceptsLimitations: e.target.checked })}
                  className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  <strong>Limitations:</strong> I acknowledge that telemedicine has limitations, including potential technical difficulties, and that the physician may not be able to provide a diagnosis or treatment without a physical examination.
                </span>
              </label>

              {/* Treatment Consent */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentData.consentsTreatment}
                  onChange={(e) => setConsentData({ ...consentData, consentsTreatment: e.target.checked })}
                  className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  <strong>Treatment Consent:</strong> I consent to receive medical consultation, advice, and recommendations from healthcare providers registered in India through this platform.
                </span>
              </label>

              {/* Payment Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentData.acceptsPaymentTerms}
                  onChange={(e) => setConsentData({ ...consentData, acceptsPaymentTerms: e.target.checked })}
                  className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  <strong>Payment Terms:</strong> I understand that all payments are in Indian Rupees (INR) and I accept responsibility for any currency conversion fees or international transaction charges.
                </span>
              </label>

              {/* Data Processing */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentData.acceptsDataProcessing}
                  onChange={(e) => setConsentData({ ...consentData, acceptsDataProcessing: e.target.checked })}
                  className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  <strong>Data Processing:</strong> I consent to the collection, storage, and processing of my personal and health data in accordance with Indian data protection laws and the platform's privacy policy.
                </span>
              </label>

              {/* Jurisdiction */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentData.acceptsJurisdiction}
                  onChange={(e) => setConsentData({ ...consentData, acceptsJurisdiction: e.target.checked })}
                  className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  <strong>Jurisdiction:</strong> I understand that any disputes will be governed by Indian law and courts in India shall have exclusive jurisdiction.
                </span>
              </label>
            </div>
          </div>

          {/* Section 4: Digital Signature */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
              Digital Signature
            </h2>
            
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
              <p className="text-sm text-indigo-800 mb-4">
                By typing your full name below, you confirm that you have read, understood, and agree to all the terms and conditions stated above.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type your full name as signature *</label>
                  <input
                    type="text"
                    value={consentData.digitalSignature}
                    onChange={(e) => setConsentData({ ...consentData, digitalSignature: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-serif text-lg italic"
                    placeholder="Your full legal name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={consentData.signatureDate}
                    onChange={(e) => setConsentData({ ...consentData, signatureDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 shadow-lg shadow-indigo-500/25"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              <>
                <span className="material-icons text-sm align-middle mr-2">check_circle</span>
                Submit Consent & Continue
              </>
            )}
          </button>

          {/* Footer Note */}
          <p className="text-xs text-gray-500 text-center">
            This consent form is legally binding. A copy will be sent to your registered email address.
          </p>
        </form>
      </div>
    </div>
  );
};

export default InternationalConsentForm;
