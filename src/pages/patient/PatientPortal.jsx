import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getPatientProfile,
  getCompletePatientData,
  searchDoctors,
  getUpcomingAppointments,
  getAppointments,
  cancelAppointment,
  getMedicalHistory,
  getAllergies,
  getMedications,
  getDocuments,
  getDoctorDocuments,
  addMedicalCondition,
  addAllergy,
  addMedication,
  deleteMedicalCondition,
  deleteAllergy,
  deleteMedication,
  updatePatientProfile,
  selectDoctor,
  createAppointment,
  confirmPayment,
  getDoctorAvailability,
  uploadDocument,
  getDocumentUrl,
  getDoctorPrescriptionUrl
} from '../../services/patientService';
import { supabase } from '../../lib/supabaseClient';
import { sendAppointmentConfirmation } from '../../services/whatsappService';
import PatientNotificationBell from '../../components/PatientNotificationBell';
import { formatPrice, getCurrency, getDoctorFee, formatDoctorFee } from '../../utils/currency';

const PatientPortal = () => {
  const navigate = useNavigate();
  const { signOut, user, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);

  // Tab-specific state
  const [doctors, setDoctors] = useState([]);
  const [allSpecializations, setAllSpecializations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [medications, setMedications] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Filters
  const [doctorFilters, setDoctorFilters] = useState({
    search: '',
    specialization: '',
    maxFee: '',
    verifiedOnly: false
  });

  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingStep, setBookingStep] = useState(1); // 1: visit type, 2: date/time, 3: payment, 4: confirmation
  const [bookingData, setBookingData] = useState({
    visitType: '', // 'online' or 'physical'
    date: '',
    time: '',
    reason: '',
    symptoms: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Add forms
  const [showAddCondition, setShowAddCondition] = useState(false);
  const [showAddAllergy, setShowAddAllergy] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [newCondition, setNewCondition] = useState({ conditionName: '', conditionType: 'current', notes: '' });
  const [newAllergy, setNewAllergy] = useState({ allergyName: '', allergyType: 'drug', severity: 'moderate' });
  const [newMedication, setNewMedication] = useState({ medicationName: '', dosage: '', frequency: '' });

  // Doctor detail modal with document upload
  const [showDoctorDetailModal, setShowDoctorDetailModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [doctorDocuments, setDoctorDocuments] = useState([]);
  const [doctorPrescriptions, setDoctorPrescriptions] = useState([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentUploadData, setDocumentUploadData] = useState({
    documentType: 'lab_report',
    description: ''
  });

  // Doctors loading state
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    loadPatientData();
  }, [user, userRole]);

  useEffect(() => {
    if (activeTab === 'doctors') {
      loadDoctors();
    } else if (activeTab === 'appointments') {
      loadAppointments();
    } else if (activeTab === 'records') {
      loadMedicalRecords();
    }
  }, [activeTab, patientData]);

  // Auto-apply filters when changed
  useEffect(() => {
    if (activeTab === 'doctors') {
      loadDoctors();
    }
  }, [doctorFilters]);

  const loadPatientData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await getPatientProfile(user.id);

      if (!data) {
        // Patient profile not found
        // Only redirect to registration if user is a patient/user role
        // Do NOT redirect admins or telecallers
        if (userRole === 'patient' || userRole === 'user') {
          navigate('/patient/register');
          return;
        }
        // For non-patient roles, just set loading to false and show empty state
        console.log('No patient profile found for role:', userRole);
        setLoading(false);
        return;
      }

      // Note: We no longer redirect for incomplete registration
      // Users can browse and book without completing intake form
      // Intake form will be shown after payment

      setPatientData(data);

      // Load upcoming appointments for home tab
      const upcoming = await getUpcomingAppointments(data.id);
      setUpcomingAppointments(upcoming);
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      setDoctorsLoading(true);
      console.log('Loading doctors with filters:', doctorFilters);
      const data = await searchDoctors(doctorFilters);
      console.log('Doctors loaded:', data?.length, data);
      setDoctors(data);

      // Extract unique specializations for filter dropdown (only on initial load)
      if (allSpecializations.length === 0) {
        const allDoctors = await searchDoctors({});
        const specs = [...new Set(allDoctors.map(d => d.specialization).filter(Boolean))].sort();
        setAllSpecializations(specs);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      setDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  };

  const loadAppointments = async () => {
    if (!patientData?.id) return;
    try {
      const data = await getAppointments(patientData.id);
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const loadMedicalRecords = async () => {
    if (!patientData?.id) return;
    try {
      const [history, allergyList, meds, docs] = await Promise.all([
        getMedicalHistory(patientData.id),
        getAllergies(patientData.id),
        getMedications(patientData.id),
        getDocuments(patientData.id)
      ]);
      setMedicalHistory(history);
      setAllergies(allergyList);
      setMedications(meds);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading medical records:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const openBookingModal = async (doctor) => {
    setSelectedDoctor(doctor);
    setBookingStep(1);
    setBookingData({ visitType: '', date: '', time: '', reason: '', symptoms: '' });
    setAvailableSlots([]);
    setCreatedAppointment(null);
    setShowBookingModal(true);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setBookingStep(1);
    setSelectedDoctor(null);
    setCreatedAppointment(null);
  };

  const loadAvailableSlots = async (date) => {
    if (!selectedDoctor || !date) return;
    setSlotsLoading(true);
    setAvailableSlots([]);
    try {
      const slots = await getDoctorAvailability(selectedDoctor.id, date);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading availability:', error);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!selectedDoctor || !bookingData.date || !bookingData.time || !bookingData.visitType) return;

    try {
      // Get fee based on patient residency (INR for Indian, USD for International)
      const feeInfo = getDoctorFee(selectedDoctor, patientData?.is_indian_resident, bookingData.visitType);

      const appointment = await createAppointment(patientData.id, {
        doctorId: selectedDoctor.id,
        patientName: `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim(),
        patientEmail: patientData.email,
        patientPhone: patientData.phone_number,
        appointmentDate: bookingData.date,
        appointmentTime: bookingData.time,
        visitType: bookingData.visitType,
        reasonForVisit: bookingData.reason,
        symptoms: bookingData.symptoms,
        consultationFee: feeInfo.amount,
        currency: feeInfo.currency // Store currency with appointment
      });

      setCreatedAppointment(appointment);
      setBookingStep(3); // Go to payment step
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Failed to create appointment. Please try again.');
    }
  };

  const handlePayment = async () => {
    if (!createdAppointment) return;

    setProcessingPayment(true);
    try {
      // Simulate payment processing (dummy payment)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Confirm payment
      const confirmedAppointment = await confirmPayment(createdAppointment.id, {
        paymentId: `PAY-${Date.now()}`,
        paymentMethod: 'card'
      });

      setCreatedAppointment(confirmedAppointment);

      // Always show confirmation step first
      setBookingStep(4);
      loadAppointments();
      loadPatientData();

      // Send WhatsApp appointment confirmation
      if (patientData?.phone_number && selectedDoctor) {
        try {
          const patientName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim() || 'Patient';
          const doctorName = `Dr. ${selectedDoctor.name || selectedDoctor.full_name || 'Doctor'}`;
          const appointmentDate = new Date(bookingData.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
          const location = bookingData.visitType === 'online' ? 'Online Consultation' : (selectedDoctor.clinic_address || 'Clinic');
          const meetingLink = bookingData.visitType === 'online' ? 'Link will be shared before appointment' : 'N/A';

          await sendAppointmentConfirmation(
            patientName,
            patientData.phone_number,
            doctorName,
            appointmentDate,
            bookingData.time,
            location,
            meetingLink,
            '+918856945017'
          );
          console.log('WhatsApp appointment confirmation sent');
        } catch (whatsappError) {
          console.error('WhatsApp notification failed:', whatsappError);
          // Don't block appointment if WhatsApp fails
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleContinuePayment = (appointment) => {
    // Set the appointment data for payment
    setCreatedAppointment(appointment);
    setSelectedDoctor(appointment.doctor);
    setBookingStep(3); // Go directly to payment step
    setShowBookingModal(true);
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      await cancelAppointment(appointmentId, 'Cancelled by patient');
      loadAppointments();
      loadPatientData();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  // Doctor Detail Modal Functions
  const openDoctorDetailModal = async (appointment) => {
    setSelectedAppointment(appointment);
    setShowDoctorDetailModal(true);
    // Load documents for this doctor
    await loadDoctorDocuments(appointment.doctor_id);
  };

  const closeDoctorDetailModal = () => {
    setShowDoctorDetailModal(false);
    setSelectedAppointment(null);
    setDoctorDocuments([]);
    setDoctorPrescriptions([]);
    setDocumentUploadData({ documentType: 'lab_report', description: '' });
  };

  const loadDoctorDocuments = async (doctorId) => {
    try {
      // Load documents uploaded by patient to this doctor
      const docs = await getDocuments(patientData.id);
      const patientDocs = docs.filter(doc => doc.doctor_id === doctorId && doc.uploaded_by !== 'doctor');
      setDoctorDocuments(patientDocs);

      // Load prescriptions/documents uploaded by doctor for this patient
      const prescriptions = await getDoctorDocuments(patientData.id, doctorId);
      setDoctorPrescriptions(prescriptions);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedAppointment) return;

    setUploadingDocument(true);
    try {
      await uploadDocument(patientData.id, file, {
        doctorId: selectedAppointment.doctor_id,
        appointmentId: selectedAppointment.id,
        documentType: documentUploadData.documentType,
        description: documentUploadData.description
      });
      alert('Document uploaded successfully!');
      // Reload documents
      await loadDoctorDocuments(selectedAppointment.doctor_id);
      setDocumentUploadData({ documentType: 'lab_report', description: '' });
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleAddCondition = async () => {
    if (!newCondition.conditionName) return;
    try {
      await addMedicalCondition(patientData.id, newCondition);
      setNewCondition({ conditionName: '', conditionType: 'current', notes: '' });
      setShowAddCondition(false);
      loadMedicalRecords();
    } catch (error) {
      console.error('Error adding condition:', error);
    }
  };

  const handleAddAllergy = async () => {
    if (!newAllergy.allergyName) return;
    try {
      await addAllergy(patientData.id, newAllergy);
      setNewAllergy({ allergyName: '', allergyType: 'drug', severity: 'moderate' });
      setShowAddAllergy(false);
      loadMedicalRecords();
    } catch (error) {
      console.error('Error adding allergy:', error);
    }
  };

  const handleAddMedication = async () => {
    if (!newMedication.medicationName) return;
    try {
      await addMedication(patientData.id, newMedication);
      setNewMedication({ medicationName: '', dosage: '', frequency: '' });
      setShowAddMedication(false);
      loadMedicalRecords();
    } catch (error) {
      console.error('Error adding medication:', error);
    }
  };

  const handleDeleteCondition = async (id) => {
    if (!confirm('Remove this condition?')) return;
    try {
      await deleteMedicalCondition(id);
      loadMedicalRecords();
    } catch (error) {
      console.error('Error deleting condition:', error);
    }
  };

  const handleDeleteAllergy = async (id) => {
    if (!confirm('Remove this allergy?')) return;
    try {
      await deleteAllergy(id);
      loadMedicalRecords();
    } catch (error) {
      console.error('Error deleting allergy:', error);
    }
  };

  const handleDeleteMedication = async (id) => {
    if (!confirm('Remove this medication?')) return;
    try {
      await deleteMedication(id);
      loadMedicalRecords();
    } catch (error) {
      console.error('Error deleting medication:', error);
    }
  };

  const handleEditProfile = () => {
    setEditProfileData({
      first_name: patientData?.first_name || '',
      last_name: patientData?.last_name || '',
      phone_number: patientData?.phone_number || '',
      date_of_birth: patientData?.date_of_birth || '',
      gender: patientData?.gender || '',
      blood_group: patientData?.blood_group || '',
      height_cm: patientData?.height_cm || '',
      weight_kg: patientData?.weight_kg || ''
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      // Map field names to what updatePatientProfile expects
      const profilePayload = {
        fullName: `${editProfileData.first_name} ${editProfileData.last_name}`.trim(),
        phone: editProfileData.phone_number,
        dateOfBirth: editProfileData.date_of_birth,
        gender: editProfileData.gender,
        bloodGroup: editProfileData.blood_group,
        heightCm: editProfileData.height_cm ? parseFloat(editProfileData.height_cm) : null,
        weightKg: editProfileData.weight_kg ? parseFloat(editProfileData.weight_kg) : null
      };
      await updatePatientProfile(patientData.id, profilePayload);
      await loadPatientData();
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditProfileData({});
  };

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: 'bg-blue-50 text-blue-700 border border-blue-200',
      confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      in_progress: 'bg-amber-50 text-amber-700 border border-amber-200',
      completed: 'bg-slate-50 text-slate-600 border border-slate-200',
      cancelled: 'bg-red-50 text-red-600 border border-red-200',
      pending: 'bg-orange-50 text-orange-700 border border-orange-200'
    };
    return styles[status] || 'bg-slate-50 text-slate-600 border border-slate-200';
  };

  const getSeverityBadge = (severity) => {
    const styles = {
      mild: 'bg-amber-50 text-amber-700 border border-amber-200',
      moderate: 'bg-orange-50 text-orange-700 border border-orange-200',
      severe: 'bg-red-50 text-red-700 border border-red-200',
      life_threatening: 'bg-red-600 text-white border border-red-600'
    };
    return styles[severity] || 'bg-slate-50 text-slate-600 border border-slate-200';
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-slate-600 font-medium">Loading your health portal...</p>
          <p className="text-sm text-slate-400 mt-1">Please wait a moment</p>
        </div>
      </div>
    );
  }

  // Consistent brand color for all doctor cards
  const getAvatarColor = (name) => {
    // Single subtle brand color for consistency
    return 'from-[#2b7ab9] to-[#3498db]';
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return 'DR';
    const parts = name.replace('Dr. ', '').split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Get time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center">
              <img 
                src="/aidoccall-logo.png" 
                alt="AidocCall" 
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Notification Bell */}
              <PatientNotificationBell patientId={patientData?.id} patientEmail={patientData?.email} />
              
              {/* User Profile */}
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-semibold text-slate-800">{`${patientData?.first_name || ''} ${patientData?.last_name || ''}`.trim() || 'Patient'}</p>
                  <p className="text-xs text-slate-400">ID: PT-{patientData?.id?.slice(-6).toUpperCase()}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(`${patientData?.first_name || ''} ${patientData?.last_name || ''}`)} flex items-center justify-center shadow-md`}>
                  <span className="text-white font-bold text-sm">{getInitials(`${patientData?.first_name || ''} ${patientData?.last_name || ''}`)}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
                  title="Sign Out"
                >
                  <span className="material-icons text-xl">logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Pill-Style Tab Navigation */}
      <nav className="bg-white/60 backdrop-blur-md border-b border-slate-200/60 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-3 overflow-x-auto scrollbar-hide">
            {[
              { id: 'home', label: 'Home', icon: 'home' },
              { id: 'doctors', label: 'Find Doctors', icon: 'person_search' },
              { id: 'appointments', label: 'Appointments', icon: 'calendar_today' },
              { id: 'records', label: 'Records', icon: 'folder_shared' },
              { id: 'profile', label: 'Profile', icon: 'person' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white shadow-lg shadow-[#2b7ab9]/25'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <span className="material-icons text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* Hero Section - Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Welcome Card */}
              <div className="lg:col-span-2 relative overflow-hidden rounded-3xl p-8 sm:p-10 text-white shadow-2xl shadow-blue-900/20 min-h-[320px]">
                {/* Background Video */}
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src="/Untitled design.mp4" type="video/mp4" />
                </video>
                {/* Dark Overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a5276]/85 via-[#2b7ab9]/70 to-[#1a5276]/80"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium text-blue-100 mb-4">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    Your health portal is active
                  </div>
                  <p className="text-blue-200 text-sm font-medium tracking-wide uppercase">{getGreeting()}</p>
                  <h2 className="text-3xl sm:text-4xl font-bold mt-2 leading-tight">{patientData?.first_name || 'Welcome'},</h2>
                  <p className="text-blue-100/80 mt-3 max-w-md text-base leading-relaxed">Manage your appointments, health records, and connect with trusted healthcare professionals.</p>
                  <div className="flex flex-wrap gap-3 mt-8">
                    <button
                      onClick={() => setActiveTab('doctors')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1a5276] font-semibold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      <span className="material-icons text-xl">search</span>
                      Find a Doctor
                    </button>
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white/15 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/25 transition-all duration-200 border border-white/20"
                    >
                      <span className="material-icons text-xl">calendar_today</span>
                      My Appointments
                    </button>
                  </div>
                </div>
              </div>

              {/* Health Snapshot Card */}
              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Health Snapshot</h3>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                      title="Edit Profile"
                    >
                      <span className="material-icons text-lg">edit</span>
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                        <span className="material-icons text-rose-500 text-xl">bloodtype</span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Blood Group</p>
                        <p className="text-lg font-bold text-slate-800">{patientData?.blood_group || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <span className="material-icons text-blue-500 text-xl">height</span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Height / Weight</p>
                        <p className="text-lg font-bold text-slate-800">
                          {patientData?.height_cm ? `${patientData.height_cm} cm` : '--'} / {patientData?.weight_kg ? `${patientData.weight_kg} kg` : '--'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <span className="material-icons text-emerald-500 text-xl">verified_user</span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Account Status</p>
                        <p className="text-lg font-bold text-emerald-600">Active</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400">Patient ID</p>
                  <p className="text-sm font-mono font-semibold text-slate-600">PT-{patientData?.id?.slice(-6).toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer" onClick={() => setActiveTab('appointments')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Upcoming</p>
                    <p className="text-4xl font-bold text-slate-800 mt-1">{upcomingAppointments.filter(a => a.status !== 'cancelled').length}</p>
                    <p className="text-xs text-slate-400 mt-1">appointments</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-[#2b7ab9]/10 to-[#2b7ab9]/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="material-icons text-[#2b7ab9] text-2xl">event_available</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer" onClick={() => setActiveTab('records')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Records</p>
                    <p className="text-4xl font-bold text-slate-800 mt-1">{medicalHistory.length}</p>
                    <p className="text-xs text-slate-400 mt-1">medical entries</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-violet-500/10 to-violet-500/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="material-icons text-violet-500 text-2xl">description</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer" onClick={() => setActiveTab('doctors')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Doctors</p>
                    <p className="text-4xl font-bold text-slate-800 mt-1">{doctors.length || '50+'}</p>
                    <p className="text-xs text-slate-400 mt-1">available now</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="material-icons text-emerald-500 text-2xl">groups</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Appointments Section */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 sm:px-8 py-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <span className="material-icons text-[#2b7ab9]">schedule</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Upcoming Appointments</h3>
                    <p className="text-sm text-slate-400">{upcomingAppointments.filter(a => a.status !== 'cancelled').length} scheduled</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('doctors')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#2b7ab9] to-[#236394] rounded-xl shadow-md shadow-[#2b7ab9]/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span className="material-icons text-lg">add</span>
                  Book New
                </button>
              </div>

              {upcomingAppointments.length === 0 ? (
                <div className="px-6 py-20 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <span className="material-icons text-slate-300" style={{ fontSize: '48px' }}>event_busy</span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-700 mb-2">No upcoming appointments</h4>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto">Schedule your next consultation with a qualified healthcare professional to stay on top of your health.</p>
                  <button
                    onClick={() => setActiveTab('doctors')}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white font-semibold rounded-xl shadow-lg shadow-[#2b7ab9]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <span className="material-icons">search</span>
                    Find a Doctor
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {upcomingAppointments.slice(0, 3).map((apt, index) => (
                    <div
                      key={apt.id}
                      className="px-6 sm:px-8 py-5 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-200 cursor-pointer"
                      onClick={() => openDoctorDetailModal(apt)}
                    >
                      <div className="flex items-center gap-4 sm:gap-5">
                        {/* Date Badge */}
                        <div className="flex-shrink-0 w-16 text-center">
                          <div className="bg-gradient-to-br from-[#2b7ab9] to-[#236394] rounded-2xl p-3 shadow-md shadow-[#2b7ab9]/15">
                            <p className="text-xs font-bold text-blue-200 uppercase">
                              {new Date(apt.appointment_date).toLocaleDateString('en-IN', { month: 'short' })}
                            </p>
                            <p className="text-2xl font-bold text-white leading-tight">
                              {new Date(apt.appointment_date).toLocaleDateString('en-IN', { day: '2-digit' })}
                            </p>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 mt-1.5">{apt.start_time?.slice(0, 5)}</p>
                        </div>

                        {/* Doctor Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800 truncate text-base">{apt.doctor?.full_name}</h4>
                            {apt.is_rescheduled && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-50 text-orange-600">
                                <span className="material-icons text-xs">event_repeat</span>
                                Rescheduled
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#2b7ab9] font-medium mt-0.5">{apt.doctor?.specialization}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${apt.visit_type === 'online' || apt.visit_type === 'video' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              <span className="material-icons text-sm">{apt.visit_type === 'online' || apt.visit_type === 'video' ? 'videocam' : 'location_on'}</span>
                              {apt.visit_type === 'online' || apt.visit_type === 'video' ? 'Video Call' : 'In-Person'}
                            </span>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${getStatusBadge(apt.status)}`}>
                              {apt.status}
                            </span>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {apt.payment_status === 'pending' && apt.status !== 'cancelled' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleContinuePayment(apt); }}
                              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5"
                            >
                              Pay Now
                            </button>
                          )}
                          <span className="material-icons text-slate-300 text-xl">chevron_right</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {upcomingAppointments.length > 3 && (
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="w-full px-6 py-4 text-center text-sm font-semibold text-[#2b7ab9] hover:bg-blue-50/50 transition-all duration-200"
                    >
                      View all {upcomingAppointments.length} appointments
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions Grid */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Quick Actions</h3>
              <p className="text-sm text-slate-400 mb-5">Common tasks at your fingertips</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('doctors')}
                  className="group bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-[#2b7ab9]/30 hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#2b7ab9]/5 to-transparent rounded-bl-full"></div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2b7ab9] to-[#236394] rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                    <span className="material-icons text-white">person_search</span>
                  </div>
                  <p className="font-bold text-slate-800">Find Doctor</p>
                  <p className="text-xs text-slate-400 mt-1">Browse and book specialists</p>
                  <span className="material-icons text-slate-200 text-lg mt-3 group-hover:text-[#2b7ab9] group-hover:translate-x-1 transition-all duration-300">arrow_forward</span>
                </button>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="group bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-emerald-300/60 hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-bl-full"></div>
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                    <span className="material-icons text-white">calendar_today</span>
                  </div>
                  <p className="font-bold text-slate-800">Appointments</p>
                  <p className="text-xs text-slate-400 mt-1">View and manage bookings</p>
                  <span className="material-icons text-slate-200 text-lg mt-3 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300">arrow_forward</span>
                </button>
                <button
                  onClick={() => setActiveTab('records')}
                  className="group bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-violet-300/60 hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/5 to-transparent rounded-bl-full"></div>
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                    <span className="material-icons text-white">folder_shared</span>
                  </div>
                  <p className="font-bold text-slate-800">Medical Records</p>
                  <p className="text-xs text-slate-400 mt-1">Access your health history</p>
                  <span className="material-icons text-slate-200 text-lg mt-3 group-hover:text-violet-500 group-hover:translate-x-1 transition-all duration-300">arrow_forward</span>
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="group bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200/60 shadow-sm hover:shadow-lg hover:border-red-300/60 hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/5 to-transparent rounded-bl-full"></div>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform duration-300">
                    <span className="material-icons text-white">emergency</span>
                  </div>
                  <p className="font-bold text-red-700">Emergency</p>
                  <p className="text-xs text-red-400 mt-1">Get immediate help</p>
                  <span className="material-icons text-red-200 text-lg mt-3 group-hover:text-red-500 group-hover:translate-x-1 transition-all duration-300">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-3xl p-6 sm:p-8 border border-slate-200/40">
              <h3 className="text-lg font-bold text-slate-800 mb-1">How AidocCall Works</h3>
              <p className="text-sm text-slate-400 mb-6">Three simple steps to quality healthcare</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200/60 flex-shrink-0">
                    <span className="text-sm font-bold text-[#2b7ab9]">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 text-sm">Search & Select</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Browse verified doctors by specialty, availability, and fees</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200/60 flex-shrink-0">
                    <span className="text-sm font-bold text-[#2b7ab9]">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 text-sm">Book & Pay</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Choose a time slot and complete secure payment online</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200/60 flex-shrink-0">
                    <span className="text-sm font-bold text-[#2b7ab9]">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 text-sm">Consult & Heal</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Join video call or visit in-person, get prescriptions digitally</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Doctors Tab */}
        {activeTab === 'doctors' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Find Doctors</h2>
                <p className="text-slate-500 mt-1">{doctors.length} doctors available for consultation</p>
              </div>
            </div>

            {/* Search & Auto-Apply Filters */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 space-y-3">
              {/* Search Input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons text-slate-400">search</span>
                <input
                  type="text"
                  value={doctorFilters.search}
                  onChange={(e) => setDoctorFilters({ ...doctorFilters, search: e.target.value })}
                  placeholder="Search doctors by name..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2b7ab9] focus:border-transparent focus:bg-white transition-all duration-200"
                />
                {doctorFilters.search && (
                  <button
                    onClick={() => setDoctorFilters({ ...doctorFilters, search: '' })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-all"
                  >
                    <span className="material-icons text-lg">close</span>
                  </button>
                )}
              </div>
              
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="material-icons text-lg">tune</span>
                  <span className="text-sm font-medium hidden sm:inline">Filters:</span>
                </div>
                <select
                  value={doctorFilters.specialization}
                  onChange={(e) => setDoctorFilters({ ...doctorFilters, specialization: e.target.value })}
                  className={`px-4 py-2.5 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2b7ab9] focus:border-transparent transition-all duration-200 ${
                    doctorFilters.specialization 
                      ? 'bg-[#e8f4fc] border-[#2b7ab9] text-[#2b7ab9]' 
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <option value="">All Specializations</option>
                  {allSpecializations.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                <select
                  value={doctorFilters.maxFee}
                  onChange={(e) => setDoctorFilters({ ...doctorFilters, maxFee: e.target.value })}
                  className={`px-4 py-2.5 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2b7ab9] focus:border-transparent transition-all duration-200 ${
                    doctorFilters.maxFee 
                      ? 'bg-[#e8f4fc] border-[#2b7ab9] text-[#2b7ab9]' 
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <option value="">Any Fee</option>
                  <option value="300">Under {formatPrice(300, patientData?.is_indian_resident)}</option>
                  <option value="500">Under {formatPrice(500, patientData?.is_indian_resident)}</option>
                  <option value="1000">Under {formatPrice(1000, patientData?.is_indian_resident)}</option>
                </select>
                <label className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl cursor-pointer transition-all duration-200 ${
                  doctorFilters.verifiedOnly 
                    ? 'bg-[#e8f5e9] border-[#4caf50] text-[#4caf50]' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}>
                  <input
                    type="checkbox"
                    checked={doctorFilters.verifiedOnly}
                    onChange={(e) => setDoctorFilters({ ...doctorFilters, verifiedOnly: e.target.checked })}
                    className="w-4 h-4 text-[#4caf50] rounded focus:ring-[#4caf50]"
                  />
                  <span className="text-sm font-medium">Verified Only</span>
                </label>
                {/* Clear Filters - only show if any filter is active */}
                {(doctorFilters.specialization || doctorFilters.maxFee || doctorFilters.verifiedOnly) && (
                  <button
                    onClick={() => setDoctorFilters({ search: doctorFilters.search, specialization: '', maxFee: '', verifiedOnly: false })}
                    className="px-3 py-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1"
                  >
                    <span className="material-icons text-base">close</span>
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Doctor Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {doctorsLoading ? (
                <>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 animate-pulse">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-slate-200 rounded-2xl flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-slate-200 rounded-lg w-3/4 mb-2"></div>
                          <div className="h-3 bg-slate-100 rounded-lg w-1/2"></div>
                        </div>
                      </div>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-slate-100 rounded"></div>
                          <div className="h-3 bg-slate-100 rounded-lg w-2/3"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-slate-100 rounded"></div>
                          <div className="h-3 bg-slate-100 rounded-lg w-1/2"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-slate-100 rounded"></div>
                          <div className="h-3 bg-slate-100 rounded-lg w-3/5"></div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="h-5 bg-slate-200 rounded-lg w-20"></div>
                        <div className="h-10 bg-slate-200 rounded-xl w-28"></div>
                      </div>
                    </div>
                  ))}
                </>
              ) : doctors.length === 0 ? (
                <div className="col-span-full">
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-16 text-center">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="material-icons text-slate-300 text-5xl">search_off</span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">No doctors found</h3>
                    <p className="text-slate-500 mb-6 max-w-sm mx-auto">Try adjusting your filters to find more healthcare providers</p>
                    <button
                      onClick={() => setDoctorFilters({ specialization: '', maxFee: '', verifiedOnly: false })}
                      className="px-6 py-2.5 text-[#2b7ab9] font-medium hover:bg-[#e8f4fc] rounded-xl transition-all duration-200"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              ) : (
                doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-[#2b7ab9]/20 transition-all duration-300 p-5"
                  >
                    {/* Card Header - Avatar & Info */}
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#2b7ab9] to-[#3498db] flex items-center justify-center shadow-md">
                          {doctor.profile_image ? (
                            <img src={doctor.profile_image} alt={doctor.full_name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <span className="text-white font-bold text-xl">{getInitials(doctor.full_name)}</span>
                          )}
                        </div>
                        {doctor.is_verified && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                            <span className="material-icons text-[#4caf50] text-sm">verified</span>
                          </div>
                        )}
                      </div>

                      {/* Doctor Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold text-lg text-slate-800 truncate">{doctor.full_name}</h3>
                            {doctor.specialization && (
                              <p className="text-[#2b7ab9] font-medium text-sm">{doctor.specialization}</p>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-400 text-sm truncate mt-1">
                          {doctor.clinic_name || doctor.clinic_address || 'Available for consultation'}
                        </p>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <span className="material-icons text-slate-400 text-base">work_outline</span>
                        <span className="text-sm font-medium">{doctor.experience_years || 0} yrs</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-icons text-amber-400 text-base">star</span>
                        <span className="text-sm font-medium text-slate-700">{doctor.rating || '4.5'}</span>
                      </div>
                      {(doctor.online_fee > 0 || doctor.consultation_fee > 0) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#e8f5e9] text-[#4caf50] rounded-md text-xs font-medium">
                          <span className="material-icons text-xs">videocam</span>
                          Online
                        </span>
                      )}
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-slate-800">
                          {formatDoctorFee(doctor, patientData?.is_indian_resident, 'online')}
                        </p>
                        <p className="text-xs text-slate-400">per consultation</p>
                      </div>
                      <button
                        onClick={() => openBookingModal(doctor)}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#2b7ab9]/25 hover:-translate-y-0.5 transition-all duration-200"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">My Appointments</h2>
                <p className="text-slate-500 mt-1">Manage and track all your consultations</p>
              </div>
              <button
                onClick={() => setActiveTab('doctors')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white font-semibold rounded-xl shadow-lg shadow-[#2b7ab9]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className="material-icons">add</span>
                Book Appointment
              </button>
            </div>

            {/* Appointments List */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              {appointments.length === 0 ? (
                <div className="px-6 py-20 text-center">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-icons text-slate-300 text-5xl">event_busy</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">No appointments yet</h3>
                  <p className="text-slate-500 mb-6 max-w-sm mx-auto">Book your first consultation with a qualified healthcare professional</p>
                  <button
                    onClick={() => setActiveTab('doctors')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white font-semibold rounded-xl shadow-lg shadow-[#2b7ab9]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <span className="material-icons">search</span>
                    Find a Doctor
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="p-5 sm:p-6 hover:bg-slate-50/50 transition-all duration-200">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Timeline Indicator */}
                        <div className="hidden lg:flex flex-col items-center gap-1 w-20 flex-shrink-0">
                          <div className="text-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 border border-slate-200/60">
                            <p className="text-xs text-slate-400 font-medium uppercase">
                              {new Date(apt.appointment_date).toLocaleDateString('en-IN', { month: 'short' })}
                            </p>
                            <p className="text-2xl font-bold text-slate-800">
                              {new Date(apt.appointment_date).getDate()}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">{apt.start_time?.slice(0, 5)}</p>
                          </div>
                        </div>

                        {/* Doctor Info */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarColor(apt.doctor?.full_name)} flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <span className="text-white font-bold text-lg">{getInitials(apt.doctor?.full_name)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 truncate">{apt.doctor?.full_name || 'Doctor'}</h4>
                            <p className="text-blue-600 font-medium text-sm">{apt.doctor?.specialization}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${apt.visit_type === 'online' || apt.visit_type === 'video' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                                <span className="material-icons text-xs">{apt.visit_type === 'online' || apt.visit_type === 'video' ? 'videocam' : 'location_on'}</span>
                                {apt.visit_type === 'online' || apt.visit_type === 'video' ? 'Online' : 'In-Person'}
                              </span>
                              {apt.payment_status && (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${apt.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                                  {apt.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
                                </span>
                              )}
                              {apt.is_rescheduled && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200">
                                  <span className="material-icons text-xs">event_repeat</span>
                                  Rescheduled
                                </span>
                              )}
                            </div>
                            {/* Mobile Date Display */}
                            <div className="lg:hidden mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                              <span className="material-icons text-slate-400 text-sm">event</span>
                              <span className="text-sm font-medium text-slate-600">
                                {new Date(apt.appointment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at {apt.start_time?.slice(0, 5)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xl font-bold text-slate-800">{formatPrice(apt.consultation_fee || apt.amount, patientData?.is_indian_resident)}</p>
                            <span className={`inline-block mt-1 px-3 py-1 rounded-lg text-xs font-semibold capitalize ${getStatusBadge(apt.status)}`}>
                              {apt.status}
                            </span>
                          </div>
                          <div className="flex flex-col gap-2">
                            {apt.status === 'confirmed' && (apt.visit_type === 'online' || apt.visit_type === 'video') && (
                              <a
                                href={apt.video_room_url || apt.meeting_link || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#2b7ab9]/25 transition-all duration-200"
                              >
                                <span className="material-icons text-sm">videocam</span>
                                Join
                              </a>
                            )}
                            {(apt.status === 'scheduled' || apt.status === 'pending') && (
                              <button
                                onClick={() => handleCancelAppointment(apt.id)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-all duration-200"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      {(apt.reason_for_visit || apt.doctor_notes) && (
                        <div className="mt-4 ml-0 lg:ml-24 space-y-2">
                          {apt.reason_for_visit && (
                            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <span className="font-semibold text-slate-700">Reason: </span>{apt.reason_for_visit}
                            </div>
                          )}
                          {apt.doctor_notes && (
                            <div className="text-sm text-blue-700 bg-blue-50 p-3 rounded-xl border border-blue-100">
                              <span className="font-semibold">Doctor Notes: </span>{apt.doctor_notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Medical Records Tab */}
        {activeTab === 'records' && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Medical Records</h2>
              <p className="text-slate-500 mt-1">Your health history and information</p>
            </div>

            {/* Medical Conditions */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#2b7ab9] to-[#236394] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="material-icons text-white text-lg">medical_information</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Medical Conditions</h3>
                    <p className="text-sm text-slate-500">{medicalHistory.length} condition{medicalHistory.length !== 1 ? 's' : ''} recorded</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddCondition(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition-all duration-200"
                >
                  <span className="material-icons text-lg">add</span>
                  Add
                </button>
              </div>
              <div className="p-6">
                {medicalHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-icons text-slate-300 text-3xl">healing</span>
                    </div>
                    <p className="text-slate-500">No medical conditions recorded</p>
                    <button
                      onClick={() => setShowAddCondition(true)}
                      className="mt-4 text-blue-600 font-medium hover:underline"
                    >
                      Add your first condition
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {medicalHistory.map((condition) => (
                      <span
                        key={condition.id}
                        className="group inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-xl border border-blue-200/60 hover:shadow-md transition-all duration-200"
                      >
                        <span className="font-medium">{condition.condition_name}</span>
                        <button
                          onClick={() => handleDeleteCondition(condition.id)}
                          className="opacity-50 hover:opacity-100 hover:text-red-500 transition-all duration-200"
                        >
                          <span className="material-icons text-sm">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Allergies */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                    <span className="material-icons text-white text-lg">warning</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Allergies</h3>
                    <p className="text-sm text-slate-500">{allergies.length} allerg{allergies.length !== 1 ? 'ies' : 'y'} recorded</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddAllergy(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition-all duration-200"
                >
                  <span className="material-icons text-lg">add</span>
                  Add
                </button>
              </div>
              <div className="p-6">
                {allergies.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-icons text-slate-300 text-3xl">do_not_disturb</span>
                    </div>
                    <p className="text-slate-500">No allergies recorded</p>
                    <button
                      onClick={() => setShowAddAllergy(true)}
                      className="mt-4 text-blue-600 font-medium hover:underline"
                    >
                      Add an allergy
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allergies.map((allergy) => (
                      <span
                        key={allergy.id}
                        className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl ${getSeverityBadge(allergy.severity)}`}
                      >
                        <span className="font-medium">{allergy.allergy_name}</span>
                        <span className="text-xs opacity-75">({allergy.severity})</span>
                        <button
                          onClick={() => handleDeleteAllergy(allergy.id)}
                          className="opacity-50 hover:opacity-100 hover:text-red-700 transition-all duration-200"
                        >
                          <span className="material-icons text-sm">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Current Medications */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <span className="material-icons text-white text-lg">medication</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Current Medications</h3>
                    <p className="text-sm text-slate-500">{medications.length} medication{medications.length !== 1 ? 's' : ''} recorded</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddMedication(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition-all duration-200"
                >
                  <span className="material-icons text-lg">add</span>
                  Add
                </button>
              </div>
              <div className="p-6">
                {medications.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-icons text-slate-300 text-3xl">pill</span>
                    </div>
                    <p className="text-slate-500">No medications recorded</p>
                    <button
                      onClick={() => setShowAddMedication(true)}
                      className="mt-4 text-blue-600 font-medium hover:underline"
                    >
                      Add a medication
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {medications.map((med) => (
                      <div key={med.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 rounded-xl border border-slate-100 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <span className="material-icons text-emerald-600">pill</span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{med.medication_name}</p>
                            <p className="text-sm text-slate-500">{med.dosage} • {med.frequency}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteMedication(med.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <span className="material-icons">delete_outline</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              {/* Profile Header */}
              <div className="relative h-32 bg-gradient-to-br from-[#2b7ab9] via-[#3498db] to-[#4caf50]">
                <div className="absolute inset-0 bg-black/10"></div>
              </div>
              
              {/* Avatar & Name */}
              <div className="relative px-6 pb-6">
                <div className="-mt-16 mb-4">
                  <div className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${getAvatarColor(`${patientData?.first_name || ''} ${patientData?.last_name || ''}`)} flex items-center justify-center border-4 border-white shadow-xl`}>
                    <span className="text-white font-bold text-4xl">{getInitials(`${patientData?.first_name || ''} ${patientData?.last_name || ''}`)}</span>
                  </div>
                </div>
                
                {!isEditingProfile ? (
                  <>
                    <h2 className="text-2xl font-bold text-slate-800">{`${patientData?.first_name || ''} ${patientData?.last_name || ''}`.trim() || 'Patient'}</h2>
                    <p className="text-slate-500">Patient ID: PT-{patientData?.id?.slice(-6).toUpperCase()}</p>
                  </>
                ) : (
                  <h2 className="text-2xl font-bold text-slate-800">Edit Your Profile</h2>
                )}
              </div>

              <div className="px-6 pb-8">
                {!isEditingProfile ? (
                  /* View Mode */
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
                        <p className="text-slate-800 font-medium">{patientData?.email || '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</label>
                        <p className="text-slate-800 font-medium">{patientData?.phone_number || '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date of Birth</label>
                        <p className="text-slate-800 font-medium">
                          {patientData?.date_of_birth
                            ? new Date(patientData.date_of_birth).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                            : '—'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gender</label>
                        <p className="text-slate-800 font-medium capitalize">{patientData?.gender || '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood Group</label>
                        <p className="text-slate-800 font-medium">{patientData?.blood_group || '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Height / Weight</label>
                        <p className="text-slate-800 font-medium">
                          {patientData?.height_cm ? `${patientData.height_cm} cm` : '—'} / {patientData?.weight_kg ? `${patientData.weight_kg} kg` : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <button
                        onClick={handleEditProfile}
                        className="w-full py-3.5 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white font-semibold rounded-xl shadow-lg shadow-[#2b7ab9]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <span className="material-icons text-lg">edit</span>
                        Edit Profile
                      </button>
                    </div>
                  </>
                ) : (
                  /* Edit Mode */
                  <>
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                          <input
                            type="text"
                            value={editProfileData.first_name}
                            onChange={(e) => setEditProfileData({...editProfileData, first_name: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                          <input
                            type="text"
                            value={editProfileData.last_name}
                            onChange={(e) => setEditProfileData({...editProfileData, last_name: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={patientData?.email || ''}
                            disabled
                            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                          />
                          <p className="text-xs text-slate-400 mt-1.5">Email cannot be changed</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                          <input
                            type="tel"
                            value={editProfileData.phone_number}
                            onChange={(e) => setEditProfileData({...editProfileData, phone_number: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth</label>
                          <input
                            type="date"
                            value={editProfileData.date_of_birth}
                            onChange={(e) => setEditProfileData({...editProfileData, date_of_birth: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
                          <select
                            value={editProfileData.gender}
                            onChange={(e) => setEditProfileData({...editProfileData, gender: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Blood Group</label>
                          <select
                            value={editProfileData.blood_group}
                            onChange={(e) => setEditProfileData({...editProfileData, blood_group: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="">Select</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Height (cm)</label>
                          <input
                            type="number"
                            value={editProfileData.height_cm}
                            onChange={(e) => setEditProfileData({...editProfileData, height_cm: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="170"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Weight (kg)</label>
                          <input
                            type="number"
                            value={editProfileData.weight_kg}
                            onChange={(e) => setEditProfileData({...editProfileData, weight_kg: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="65"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
                      <button
                        onClick={handleCancelEdit}
                        disabled={savingProfile}
                        className="flex-1 py-3.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="flex-1 py-3.5 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white font-semibold rounded-xl shadow-lg shadow-[#2b7ab9]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {savingProfile ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <span className="material-icons text-lg">check</span>
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =============== MODALS =============== */}

      {/* Booking Modal - Multi-Step Flow */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-5 border-b border-slate-100 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">
                  {bookingStep === 1 && 'Select Visit Type'}
                  {bookingStep === 2 && 'Choose Date & Time'}
                  {bookingStep === 3 && 'Payment'}
                  {bookingStep === 4 && 'Booking Confirmed'}
                </h3>
                <button onClick={closeBookingModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200">
                  <span className="material-icons">close</span>
                </button>
              </div>

              {/* Progress Steps */}
              {bookingStep < 4 && (
                <div className="flex items-center justify-between mt-5">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        bookingStep >= step 
                          ? 'bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white shadow-lg shadow-[#2b7ab9]/25' 
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {bookingStep > step ? (
                          <span className="material-icons text-lg">check</span>
                        ) : step}
                      </div>
                      {step < 3 && (
                        <div className={`w-12 sm:w-20 h-1.5 mx-2 rounded-full transition-all duration-300 ${bookingStep > step ? 'bg-gradient-to-r from-[#2b7ab9] to-[#236394]' : 'bg-slate-100'}`} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Doctor Info Card */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl border border-slate-100">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarColor(selectedDoctor.full_name)} flex items-center justify-center shadow-lg`}>
                  {selectedDoctor.profile_image ? (
                    <img src={selectedDoctor.profile_image} alt={selectedDoctor.full_name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <span className="text-white font-bold text-lg">{getInitials(selectedDoctor.full_name)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{selectedDoctor.full_name}</p>
                  <p className="text-sm text-blue-600 font-medium">{selectedDoctor.specialization}</p>
                  <p className="text-xs text-slate-400 truncate">{selectedDoctor.clinic_name || selectedDoctor.clinic_address || ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-800">{formatDoctorFee(selectedDoctor, patientData?.is_indian_resident, bookingData.visitType)}</p>
                  <p className="text-xs text-slate-400">per session</p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              {/* Step 1: Visit Type Selection */}
              {bookingStep === 1 && (
                <div className="space-y-4">
                  <p className="text-slate-600">How would you like to consult with the doctor?</p>

                  <button
                    onClick={() => {
                      setBookingData({ ...bookingData, visitType: 'online' });
                      setBookingStep(2);
                    }}
                    className="w-full p-5 border-2 border-slate-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#2b7ab9] to-[#236394] rounded-2xl flex items-center justify-center shadow-lg shadow-[#2b7ab9]/25 group-hover:scale-105 transition-transform duration-200">
                        <span className="material-icons text-white text-2xl">video_call</span>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-bold text-slate-800 text-lg">Online Consultation</p>
                        <p className="text-sm text-slate-500">Video call from home</p>
                      </div>
                      <span className="material-icons text-slate-300 group-hover:text-blue-500 transition-colors duration-200">arrow_forward</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setBookingData({ ...bookingData, visitType: 'physical' });
                      setBookingStep(2);
                    }}
                    className="w-full p-5 border-2 border-slate-200 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50/50 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform duration-200">
                        <span className="material-icons text-white text-2xl">local_hospital</span>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-bold text-slate-800 text-lg">Physical Visit</p>
                        <p className="text-sm text-slate-500">Visit clinic in person</p>
                      </div>
                      <span className="material-icons text-slate-300 group-hover:text-emerald-500 transition-colors duration-200">arrow_forward</span>
                    </div>
                  </button>
                </div>
              )}

              {/* Step 2: Date, Time & Details */}
              {bookingStep === 2 && (
                <div className="space-y-5">
                  {/* Visit Type Badge */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
                    bookingData.visitType === 'online'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    <span className="material-icons text-lg">
                      {bookingData.visitType === 'online' ? 'video_call' : 'local_hospital'}
                    </span>
                    {bookingData.visitType === 'online' ? 'Online Consultation' : 'Physical Visit'}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Select Date</label>
                    <input
                      type="date"
                      value={bookingData.date}
                      onChange={(e) => {
                        setBookingData({ ...bookingData, date: e.target.value, time: '' });
                        loadAvailableSlots(e.target.value);
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {bookingData.date && slotsLoading && (
                    <div className="flex items-center justify-center py-8 gap-3">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-slate-500">Loading available slots...</p>
                    </div>
                  )}

                  {bookingData.date && !slotsLoading && availableSlots.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Select Time</label>
                      <div className="grid grid-cols-4 gap-2">
                        {availableSlots.map((slot, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setBookingData({ ...bookingData, time: slot.start_time || slot.time_slot_start })}
                            className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                              bookingData.time === (slot.start_time || slot.time_slot_start)
                                ? 'bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white shadow-lg shadow-[#2b7ab9]/25'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {(slot.start_time || slot.time_slot_start).slice(0, 5)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {bookingData.date && !slotsLoading && availableSlots.length === 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                        <span className="material-icons text-lg">event_busy</span>
                        Doctor is not available on this date. Please select a different date.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Reason for Visit</label>
                    <input
                      type="text"
                      value={bookingData.reason}
                      onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Brief reason for consultation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Symptoms (Optional)</label>
                    <textarea
                      value={bookingData.symptoms}
                      onChange={(e) => setBookingData({ ...bookingData, symptoms: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      rows={3}
                      placeholder="Describe your symptoms"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setBookingStep(1)}
                      className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-200"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreateAppointment}
                      disabled={!bookingData.date || !bookingData.time}
                      className="flex-1 py-3.5 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white rounded-xl font-semibold shadow-lg shadow-[#2b7ab9]/25 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {bookingStep === 3 && createdAppointment && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl p-6 border border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="material-icons text-blue-500">receipt_long</span>
                      Booking Summary
                    </h4>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Visit Type</span>
                        <span className="font-semibold text-slate-800 capitalize">
                          {bookingData.visitType === 'online' ? 'Online Consultation' : 'Physical Visit'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(bookingData.date).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Time</span>
                        <span className="font-semibold text-slate-800">{bookingData.time}</span>
                      </div>
                      {bookingData.reason && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Reason</span>
                          <span className="font-semibold text-slate-800 text-right max-w-[60%]">{bookingData.reason}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-200 mt-4 pt-4">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold text-slate-800">Total Amount</span>
                        <span className="font-bold text-blue-600">{formatDoctorFee(selectedDoctor, patientData?.is_indian_resident, bookingData.visitType)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Demo Payment Card */}
                  <div className="border border-slate-200 rounded-2xl p-5">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="material-icons text-blue-500">credit_card</span>
                      Payment Method
                    </h4>
                    <div className="p-5 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl text-white shadow-xl">
                      <div className="flex justify-between items-start mb-10">
                        <span className="material-icons text-3xl text-slate-400">credit_card</span>
                        <span className="text-lg font-bold text-slate-300 tracking-wider">VISA</span>
                      </div>
                      <p className="font-mono text-xl tracking-widest mb-3">•••• •••• •••• 4242</p>
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>Demo Card</span>
                        <span>12/28</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-4 text-center">
                      This is a demo payment. No actual charge will be made.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setBookingStep(2)}
                      disabled={processingPayment}
                      className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-200 disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={processingPayment}
                      className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {processingPayment ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <span className="material-icons text-lg">lock</span>
                          Pay {formatDoctorFee(selectedDoctor, patientData?.is_indian_resident, bookingData.visitType)}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {bookingStep === 4 && createdAppointment && (
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30">
                    <span className="material-icons text-white text-5xl">check</span>
                  </div>
                  <h4 className="text-2xl font-bold text-slate-800 mb-2">Booking Confirmed!</h4>
                  <p className="text-slate-500 mb-6">Your appointment has been successfully booked</p>

                  <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-2xl p-6 text-left border border-slate-100">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          bookingData.visitType === 'online' ? 'bg-blue-100' : 'bg-emerald-100'
                        }`}>
                          <span className={`material-icons text-xl ${
                            bookingData.visitType === 'online' ? 'text-blue-600' : 'text-emerald-600'
                          }`}>
                            {bookingData.visitType === 'online' ? 'video_call' : 'local_hospital'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {bookingData.visitType === 'online' ? 'Online Consultation' : 'Physical Visit'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {bookingData.visitType === 'online'
                              ? 'Link will be sent before appointment'
                              : 'Visit clinic at scheduled time'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Date</p>
                          <p className="font-semibold text-slate-800">
                            {new Date(bookingData.date).toLocaleDateString('en-IN', {
                              weekday: 'short', day: 'numeric', month: 'short'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Time</p>
                          <p className="font-semibold text-slate-800">{bookingData.time}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Doctor</p>
                          <p className="font-semibold text-slate-800">{selectedDoctor.full_name}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Status</p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold">
                            <span className="material-icons text-xs">check_circle</span>
                            Confirmed
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Amount Paid</span>
                          <span className="font-bold text-lg text-slate-800">{createdAppointment.amount ? formatPrice(createdAppointment.amount, patientData?.is_indian_resident) : formatDoctorFee(selectedDoctor, patientData?.is_indian_resident, bookingData.visitType)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    {!patientData?.intake_form_completed ? (
                      <>
                        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
                          <span className="material-icons text-lg">info</span>
                          Please complete your intake form to finalize your appointment.
                        </p>
                        <button
                          onClick={() => {
                            closeBookingModal();
                            navigate('/patient/intake', {
                              state: { appointmentId: createdAppointment.id }
                            });
                          }}
                          className="w-full py-3.5 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white font-semibold rounded-xl shadow-lg shadow-[#2b7ab9]/25 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <span className="material-icons">assignment</span>
                          Continue to Intake Form
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            closeBookingModal();
                            setActiveTab('home');
                          }}
                          className="w-full py-3.5 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white font-semibold rounded-xl shadow-lg shadow-[#2b7ab9]/25 hover:shadow-xl transition-all duration-200"
                        >
                          Go to Dashboard
                        </button>
                        <button
                          onClick={() => {
                            closeBookingModal();
                            setActiveTab('appointments');
                          }}
                          className="w-full py-3.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all duration-200"
                        >
                          View My Appointments
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Condition Modal */}
      {showAddCondition && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-5">Add Medical Condition</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newCondition.conditionName}
                onChange={(e) => setNewCondition({ ...newCondition, conditionName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Condition name"
              />
              <select
                value={newCondition.conditionType}
                onChange={(e) => setNewCondition({ ...newCondition, conditionType: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="current">Current</option>
                <option value="past">Past</option>
                <option value="family_history">Family History</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddCondition(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCondition}
                  className="flex-1 py-3 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white rounded-xl font-semibold shadow-lg shadow-[#2b7ab9]/25 hover:shadow-xl transition-all duration-200"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Allergy Modal */}
      {showAddAllergy && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-5">Add Allergy</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newAllergy.allergyName}
                onChange={(e) => setNewAllergy({ ...newAllergy, allergyName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Allergy name"
              />
              <select
                value={newAllergy.allergyType}
                onChange={(e) => setNewAllergy({ ...newAllergy, allergyType: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="drug">Drug</option>
                <option value="food">Food</option>
                <option value="environmental">Environmental</option>
                <option value="other">Other</option>
              </select>
              <select
                value={newAllergy.severity}
                onChange={(e) => setNewAllergy({ ...newAllergy, severity: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="life_threatening">Life Threatening</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddAllergy(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAllergy}
                  className="flex-1 py-3 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white rounded-xl font-semibold shadow-lg shadow-[#2b7ab9]/25 hover:shadow-xl transition-all duration-200"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Medication Modal */}
      {showAddMedication && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-5">Add Medication</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newMedication.medicationName}
                onChange={(e) => setNewMedication({ ...newMedication, medicationName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Medication name"
              />
              <input
                type="text"
                value={newMedication.dosage}
                onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Dosage (e.g., 500mg)"
              />
              <input
                type="text"
                value={newMedication.frequency}
                onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Frequency (e.g., Twice daily)"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddMedication(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMedication}
                  className="flex-1 py-3 bg-gradient-to-r from-[#2b7ab9] to-[#236394] text-white rounded-xl font-semibold shadow-lg shadow-[#2b7ab9]/25 hover:shadow-xl transition-all duration-200"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Detail Modal with Document Upload */}
      {showDoctorDetailModal && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-5 border-b border-slate-100 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Appointment Details</h3>
                <button onClick={closeDoctorDetailModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200">
                  <span className="material-icons">close</span>
                </button>
              </div>
            </div>

            {/* Doctor Info */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getAvatarColor(selectedAppointment.doctor?.full_name)} flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-bold text-2xl">{getInitials(selectedAppointment.doctor?.full_name)}</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800">{selectedAppointment.doctor?.full_name}</h4>
                  <p className="text-blue-600 font-medium">{selectedAppointment.doctor?.specialization}</p>
                  <p className="text-sm text-slate-400">{selectedAppointment.doctor?.clinic_name}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-slate-500 text-sm">Date: </span>
                  <span className="font-semibold text-slate-800">{new Date(selectedAppointment.appointment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className={`px-4 py-2 rounded-xl ${getStatusBadge(selectedAppointment.status)}`}>
                  <span className="font-semibold capitalize">{selectedAppointment.status}</span>
                </div>
              </div>
            </div>

            {/* Prescriptions from Doctor Section */}
            <div className="p-6 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-emerald-600 text-lg">medical_services</span>
                </div>
                Documents from Doctor ({doctorPrescriptions.length})
              </h4>
              {doctorPrescriptions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="material-icons text-slate-300 text-2xl">receipt_long</span>
                  </div>
                  <p className="text-slate-500">No documents uploaded by doctor yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {doctorPrescriptions.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <span className="material-icons text-emerald-600">description</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{doc.file_name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-medium">{doc.file_type}</span>
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            try {
                              const url = await getDoctorPrescriptionUrl(doc.file_url);
                              window.open(url, '_blank');
                            } catch (err) {
                              console.error('Error opening document:', err);
                              alert('Error opening document. Please ask your doctor to re-upload.');
                            }
                          }}
                          className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all duration-200"
                          title="View"
                        >
                          <span className="material-icons">visibility</span>
                        </button>
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            try {
                              const url = await getDoctorPrescriptionUrl(doc.file_url);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = doc.file_name;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } catch (err) {
                              console.error('Error downloading document:', err);
                              alert('Error downloading document. Please ask your doctor to re-upload.');
                            }
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200"
                          title="Download"
                        >
                          <span className="material-icons">download</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Document Section */}
            <div className="p-6 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-blue-600 text-lg">upload_file</span>
                </div>
                Upload Document for Doctor
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Document Type</label>
                  <select
                    value={documentUploadData.documentType}
                    onChange={(e) => setDocumentUploadData({ ...documentUploadData, documentType: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="lab_report">Lab Report</option>
                    <option value="prescription">Prescription</option>
                    <option value="scan">Scan / X-Ray</option>
                    <option value="medical_certificate">Medical Certificate</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description (Optional)</label>
                  <textarea
                    value={documentUploadData.description}
                    onChange={(e) => setDocumentUploadData({ ...documentUploadData, description: e.target.value })}
                    placeholder="Brief description of the document..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Select File</label>
                  <input
                    type="file"
                    onChange={handleDocumentUpload}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    disabled={uploadingDocument}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100"
                  />
                  {uploadingDocument && (
                    <div className="flex items-center gap-2 text-blue-600 mt-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">Uploading...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Uploaded Documents List */}
            <div className="p-6">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-violet-600 text-lg">folder</span>
                </div>
                Documents Shared ({doctorDocuments.length})
              </h4>
              {doctorDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="material-icons text-slate-300 text-2xl">folder_open</span>
                  </div>
                  <p className="text-slate-500">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {doctorDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                          <span className="material-icons text-violet-600">description</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{doc.file_name}</p>
                          <p className="text-xs text-slate-500">
                            {doc.file_type} • {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href="#"
                        onClick={async (e) => {
                          e.preventDefault();
                          try {
                            const url = await getDocumentUrl(doc.file_url);
                            window.open(url, '_blank');
                          } catch (err) {
                            alert('Error opening document');
                          }
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200"
                      >
                        <span className="material-icons">visibility</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="p-6 border-t border-slate-100">
              <button
                onClick={closeDoctorDetailModal}
                className="w-full py-3.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 pb-8 pt-6 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-400">© 2026 AidocCall. All rights reserved.</p>
          <p className="text-xs text-slate-300 mt-1">v2.0 - 2026-03-07</p>
        </div>
      </footer>
    </div>
  );
};

export default PatientPortal;