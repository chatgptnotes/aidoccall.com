import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  createPatientProfile,
  addPatientAddress,
  addEmergencyContact,
  addMedicalCondition,
  addAllergy,
  updateRegistrationStep
} from '../../services/patientService';

const STEPS = [
  { id: 1, title: 'Account', description: 'Create your account' },
  { id: 2, title: 'Personal', description: 'Personal information' },
  { id: 3, title: 'Address', description: 'Your address' },
  { id: 4, title: 'Emergency', description: 'Emergency contact' },
  { id: 5, title: 'Medical', description: 'Medical info (optional)' }
];

const COMMON_CONDITIONS = [
  'Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'Thyroid',
  'Arthritis', 'Cancer', 'COPD', 'Kidney Disease', 'Liver Disease'
];

const COMMON_ALLERGIES = [
  'Penicillin', 'Sulfa drugs', 'Aspirin', 'NSAIDs', 'Latex',
  'Peanuts', 'Shellfish', 'Eggs', 'Milk', 'Dust'
];

const PatientRegister = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patientId, setPatientId] = useState(null);

  // Step 1: Account
  const [accountData, setAccountData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Step 2: Personal
  const [personalData, setPersonalData] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: ''
  });

  // Step 3: Address
  const [addressData, setAddressData] = useState({
    streetAddress: '',
    apartmentUnit: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  // Step 4: Emergency Contact
  const [emergencyData, setEmergencyData] = useState({
    contactName: '',
    relationship: '',
    phone: '',
    email: ''
  });

  // Step 5: Medical (optional)
  const [medicalData, setMedicalData] = useState({
    bloodGroup: 'unknown',
    heightCm: '',
    weightKg: '',
    conditions: [],
    allergies: [],
    customCondition: '',
    customAllergy: ''
  });

  const validateStep = (step) => {
    setError('');

    switch (step) {
      case 1:
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
        return true;

      case 2:
        if (!personalData.fullName || !personalData.phone) {
          setError('Name and phone are required');
          return false;
        }
        if (personalData.phone.length < 10) {
          setError('Please enter a valid phone number');
          return false;
        }
        return true;

      case 3:
        if (!addressData.streetAddress || !addressData.city || !addressData.state || !addressData.postalCode) {
          setError('Please fill in all required address fields');
          return false;
        }
        return true;

      case 4:
        if (!emergencyData.contactName || !emergencyData.relationship || !emergencyData.phone) {
          setError('Please fill in emergency contact details');
          return false;
        }
        return true;

      case 5:
        return true; // Optional step

      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setError('');

    try {
      if (currentStep === 1) {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: accountData.email,
          password: accountData.password,
          options: {
            data: {
              role: 'patient'
            }
          }
        });

        if (authError) throw authError;

        let userId = authData.user?.id;
        let session = authData.session;

        // If no session returned, try to sign in immediately
        if (!session && userId) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: accountData.email,
            password: accountData.password
          });

          if (signInError) {
            // If sign-in fails, email confirmation might be required
            setError('Account created! Please check your email to confirm, then sign in.');
            return;
          }

          session = signInData.session;
          userId = signInData.user?.id;
        }

        if (!userId) {
          throw new Error('Failed to create account. Please try again.');
        }

        // Wait a moment for session to propagate
        await new Promise(resolve => setTimeout(resolve, 300));

        // Create patient profile
        const profile = await createPatientProfile(userId, {
          email: accountData.email,
          fullName: personalData.fullName || 'Patient'
        });

        setPatientId(profile.id);
      }

      if (currentStep === 2 && patientId) {
        await updateRegistrationStep(patientId, 2);
      }

      if (currentStep === 3 && patientId) {
        await addPatientAddress(patientId, {
          ...addressData,
          isPrimary: true,
          addressType: 'home'
        });
        await updateRegistrationStep(patientId, 3);
      }

      if (currentStep === 4 && patientId) {
        await addEmergencyContact(patientId, {
          ...emergencyData,
          isPrimary: true
        });
        await updateRegistrationStep(patientId, 4);
      }

      if (currentStep === 5 && patientId) {
        // Save medical info
        const { bloodGroup, heightCm, weightKg, conditions, allergies } = medicalData;

        // Update patient with basic medical info
        await supabase
          .from('doc_patients')
          .update({
            blood_group: bloodGroup,
            height_cm: heightCm || null,
            weight_kg: weightKg || null,
            registration_completed: true,
            registration_step: 5
          })
          .eq('id', patientId);

        // Add conditions
        for (const condition of conditions) {
          await addMedicalCondition(patientId, {
            conditionName: condition,
            conditionType: 'current'
          });
        }

        // Add allergies
        for (const allergy of allergies) {
          await addAllergy(patientId, {
            allergyName: allergy,
            allergyType: 'drug',
            severity: 'moderate'
          });
        }

        // Registration complete - navigate to dashboard
        navigate('/dashboard');
        return;
      }

      setCurrentStep(currentStep + 1);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    if (currentStep === 5 && patientId) {
      setLoading(true);
      try {
        await supabase
          .from('doc_patients')
          .update({
            registration_completed: true,
            registration_step: 5
          })
          .eq('id', patientId);

        navigate('/dashboard');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleCondition = (condition) => {
    setMedicalData(prev => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter(c => c !== condition)
        : [...prev.conditions, condition]
    }));
  };

  const toggleAllergy = (allergy) => {
    setMedicalData(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy]
    }));
  };

  const addCustomCondition = () => {
    if (medicalData.customCondition && !medicalData.conditions.includes(medicalData.customCondition)) {
      setMedicalData(prev => ({
        ...prev,
        conditions: [...prev.conditions, prev.customCondition],
        customCondition: ''
      }));
    }
  };

  const addCustomAllergy = () => {
    if (medicalData.customAllergy && !medicalData.allergies.includes(medicalData.customAllergy)) {
      setMedicalData(prev => ({
        ...prev,
        allergies: [...prev.allergies, prev.customAllergy],
        customAllergy: ''
      }));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={accountData.email}
                onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={accountData.password}
                onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={accountData.confirmPassword}
                onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm your password"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={personalData.fullName}
                onChange={(e) => setPersonalData({ ...personalData, fullName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={personalData.phone}
                onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={personalData.dateOfBirth}
                onChange={(e) => setPersonalData({ ...personalData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={personalData.gender}
                onChange={(e) => setPersonalData({ ...personalData, gender: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                value={addressData.streetAddress}
                onChange={(e) => setAddressData({ ...addressData, streetAddress: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="House/Flat No, Street Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apartment/Unit (Optional)</label>
              <input
                type="text"
                value={addressData.apartmentUnit}
                onChange={(e) => setAddressData({ ...addressData, apartmentUnit: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Apt, Suite, Building"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={addressData.city}
                  onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={addressData.state}
                  onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="State"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={addressData.postalCode}
                  onChange={(e) => setAddressData({ ...addressData, postalCode: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="PIN Code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={addressData.country}
                  onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  readOnly
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-800 text-sm">
                <span className="material-icons text-sm align-middle mr-1">info</span>
                This person will be contacted in case of emergency during your consultations.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input
                type="text"
                value={emergencyData.contactName}
                onChange={(e) => setEmergencyData({ ...emergencyData, contactName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full name of emergency contact"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
              <select
                value={emergencyData.relationship}
                onChange={(e) => setEmergencyData({ ...emergencyData, relationship: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select relationship</option>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Child">Child</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={emergencyData.phone}
                onChange={(e) => setEmergencyData({ ...emergencyData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={emergencyData.email}
                onChange={(e) => setEmergencyData({ ...emergencyData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="emergency@email.com"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <span className="material-icons text-sm align-middle mr-1">info</span>
                This information helps doctors provide better care. You can skip this step and add later.
              </p>
            </div>

            {/* Basic Medical Info */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                <select
                  value={medicalData.bloodGroup}
                  onChange={(e) => setMedicalData({ ...medicalData, bloodGroup: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="unknown">Unknown</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={medicalData.heightCm}
                  onChange={(e) => setMedicalData({ ...medicalData, heightCm: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="170"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={medicalData.weightKg}
                  onChange={(e) => setMedicalData({ ...medicalData, weightKg: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="70"
                />
              </div>
            </div>

            {/* Medical Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Do you have any medical conditions?
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_CONDITIONS.map(condition => (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => toggleCondition(condition)}
                    className={`px-3 py-1 rounded-full text-sm border transition ${
                      medicalData.conditions.includes(condition)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {condition}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={medicalData.customCondition}
                  onChange={(e) => setMedicalData({ ...medicalData, customCondition: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add other condition"
                />
                <button
                  type="button"
                  onClick={addCustomCondition}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
              {medicalData.conditions.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {medicalData.conditions.join(', ')}
                </div>
              )}
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Do you have any allergies?
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_ALLERGIES.map(allergy => (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleAllergy(allergy)}
                    className={`px-3 py-1 rounded-full text-sm border transition ${
                      medicalData.allergies.includes(allergy)
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-red-500'
                    }`}
                  >
                    {allergy}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={medicalData.customAllergy}
                  onChange={(e) => setMedicalData({ ...medicalData, customAllergy: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add other allergy"
                />
                <button
                  type="button"
                  onClick={addCustomAllergy}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
              {medicalData.allergies.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {medicalData.allergies.join(', ')}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-white text-3xl">local_hospital</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Create Patient Account</h1>
          <p className="text-gray-600 mt-2">Join AidocCall for seamless healthcare</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    currentStep > step.id
                      ? 'bg-green-600 text-white'
                      : currentStep === step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step.id ? (
                    <span className="material-icons text-sm">check</span>
                  ) : (
                    step.id
                  )}
                </div>
                <span className={`text-xs mt-1 ${currentStep >= step.id ? 'text-gray-800' : 'text-gray-400'}`}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded ${
                    currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {STEPS[currentStep - 1].title}
          </h2>
          <p className="text-gray-600 mb-6">{STEPS[currentStep - 1].description}</p>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <span className="material-icons text-sm align-middle mr-2">error</span>
              {error}
            </div>
          )}

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="material-icons text-sm align-middle mr-1">arrow_back</span>
              Back
            </button>

            <div className="flex gap-3">
              {currentStep === 5 && (
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Skip for now
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : currentStep === 5 ? (
                  <>
                    Complete Registration
                    <span className="material-icons text-sm align-middle ml-1">check_circle</span>
                  </>
                ) : (
                  <>
                    Continue
                    <span className="material-icons text-sm align-middle ml-1">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
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
          v1.2 - 2025-01-10
        </div>
      </div>
    </div>
  );
};

export default PatientRegister;
