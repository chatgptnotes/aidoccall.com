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

      if (!data.registration_completed) {
        // Registration not completed
        // Only redirect to registration if user is a patient/user role
        if (userRole === 'patient' || userRole === 'user') {
          navigate('/patient/register');
          return;
        }
        console.log('Registration not completed for role:', userRole);
        setLoading(false);
        return;
      }

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
      // Use online_fee for online visits, consultation_fee for physical visits
      const fee = bookingData.visitType === 'online'
        ? (selectedDoctor.online_fee || selectedDoctor.consultation_fee || 0)
        : (selectedDoctor.consultation_fee || selectedDoctor.online_fee || 0);

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
        consultationFee: fee
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
      setBookingStep(4); // Go to confirmation step
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
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityBadge = (severity) => {
    const styles = {
      mild: 'bg-yellow-100 text-yellow-800',
      moderate: 'bg-orange-100 text-orange-800',
      severe: 'bg-red-100 text-red-800',
      life_threatening: 'bg-red-600 text-white'
    };
    return styles[severity] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your health portal...</p>
        </div>
      </div>
    );
  }

  // Generate avatar color based on name - subtle muted colors
  const getAvatarColor = (name) => {
    const colors = [
      'from-slate-500 to-slate-600',
      'from-blue-400 to-blue-500',
      'from-emerald-400 to-emerald-500',
      'from-violet-400 to-violet-500',
      'from-rose-400 to-rose-500',
      'from-amber-400 to-amber-500',
      'from-cyan-400 to-cyan-500',
      'from-indigo-400 to-indigo-500'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="material-icons text-white text-lg">add</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">AidocCall</h1>
                <p className="text-xs text-gray-500">Patient Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="font-medium text-gray-900 text-sm">{`${patientData?.first_name || ''} ${patientData?.last_name || ''}`.trim()}</p>
                <p className="text-xs text-gray-400">PT-{patientData?.id?.slice(-6).toUpperCase()}</p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
                {getInitials(`${patientData?.first_name || ''} ${patientData?.last_name || ''}`)}
              </div>
              <PatientNotificationBell patientId={patientData?.id} patientEmail={patientData?.email} />
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <span className="material-icons text-xl">logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-[52px] z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 overflow-x-auto scrollbar-hide">
            {[
              { id: 'home', label: 'Home', icon: 'home' },
              { id: 'doctors', label: 'Find Doctors', icon: 'person_search' },
              { id: 'appointments', label: 'Appointments', icon: 'event' },
              { id: 'records', label: 'Medical Records', icon: 'folder_shared' },
              { id: 'profile', label: 'Profile', icon: 'account_circle' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 border-b-2 text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="material-icons text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Welcome Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-500 text-sm">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}</p>
              <h2 className="text-xl font-semibold text-gray-900 mt-1">Welcome back, {patientData?.first_name || 'Patient'}</h2>
              <p className="text-gray-500 text-sm mt-2">Manage your health appointments and records</p>
              <button
                onClick={() => setActiveTab('doctors')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
              >
                <span className="material-icons text-sm">search</span>
                Find a Doctor
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <span className="material-icons text-blue-600 text-xl">event</span>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{upcomingAppointments.filter(a => a.status !== 'cancelled').length}</p>
                    <p className="text-xs text-gray-500">Upcoming</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <span className="material-icons text-red-500 text-xl">bloodtype</span>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{patientData?.blood_group || 'N/A'}</p>
                    <p className="text-xs text-gray-500">Blood Group</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <span className="material-icons text-green-600 text-xl">check_circle</span>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">Active</p>
                    <p className="text-xs text-gray-500">Status</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-medium text-gray-900">Upcoming Appointments</h3>
                <button
                  onClick={() => setActiveTab('doctors')}
                  className="text-blue-600 text-sm hover:text-blue-700"
                >
                  Book New
                </button>
              </div>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-10 px-6">
                  <span className="material-icons text-gray-300 text-4xl mb-3">event_busy</span>
                  <p className="text-gray-500 text-sm mb-4">No upcoming appointments</p>
                  <button
                    onClick={() => setActiveTab('doctors')}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Find a Doctor
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {upcomingAppointments.slice(0, 3).map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-all">
                      <div
                        className="flex items-center gap-4 cursor-pointer flex-1"
                        onClick={() => openDoctorDetailModal(apt)}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarColor(apt.doctor?.full_name)} flex items-center justify-center shadow-md`}>
                          <span className="text-white font-bold text-sm">{getInitials(apt.doctor?.full_name)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 hover:text-blue-600">{apt.doctor?.full_name}</p>
                          <p className="text-sm text-gray-500">{apt.doctor?.specialization}</p>
                        </div>
                      </div>
                      <div className="text-center px-4">
                        <p className="font-semibold text-gray-900">
                          {new Date(apt.appointment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-sm text-gray-500">{apt.start_time?.slice(0, 5)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {apt.is_rescheduled && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-orange-100 text-orange-700 flex items-center gap-1">
                            <span className="material-icons text-xs">event_repeat</span>
                            Rescheduled
                          </span>
                        )}
                        {apt.payment_status === 'pending' && apt.status !== 'cancelled' && (
                          <button
                            onClick={() => handleContinuePayment(apt)}
                            className="px-4 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 shadow-md"
                          >
                            Pay Now
                          </button>
                        )}
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${getStatusBadge(apt.status)}`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => setActiveTab('doctors')}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-gray-300 hover:bg-gray-50 transition"
                >
                  <span className="material-icons text-blue-600 text-xl mb-2">person_search</span>
                  <p className="font-medium text-gray-900 text-sm">Find Doctor</p>
                </button>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-gray-300 hover:bg-gray-50 transition"
                >
                  <span className="material-icons text-green-600 text-xl mb-2">calendar_today</span>
                  <p className="font-medium text-gray-900 text-sm">Appointments</p>
                </button>
                <button
                  onClick={() => setActiveTab('records')}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-gray-300 hover:bg-gray-50 transition"
                >
                  <span className="material-icons text-purple-600 text-xl mb-2">folder_shared</span>
                  <p className="font-medium text-gray-900 text-sm">Medical Records</p>
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 text-left hover:border-red-300 hover:bg-red-100 transition"
                >
                  <span className="material-icons text-red-600 text-xl mb-2">emergency</span>
                  <p className="font-medium text-red-700 text-sm">Emergency</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Doctors Tab */}
        {activeTab === 'doctors' && (
          <div className="space-y-5">
            {/* Header */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Find Doctors</h2>
              <p className="text-gray-500 text-sm mt-0.5">{doctors.length} doctors available</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={doctorFilters.specialization}
                onChange={(e) => setDoctorFilters({ ...doctorFilters, specialization: e.target.value })}
                className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Specializations</option>
                {allSpecializations.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
              <select
                value={doctorFilters.maxFee}
                onChange={(e) => setDoctorFilters({ ...doctorFilters, maxFee: e.target.value })}
                className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Any Fee</option>
                <option value="300">Under Rs. 300</option>
                <option value="500">Under Rs. 500</option>
                <option value="1000">Under Rs. 1000</option>
              </select>
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  checked={doctorFilters.verifiedOnly}
                  onChange={(e) => setDoctorFilters({ ...doctorFilters, verifiedOnly: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Verified Only</span>
              </label>
              <button
                onClick={loadDoctors}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <span className="material-icons text-sm">search</span>
                Search
              </button>
            </div>

            {/* Doctor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {doctors.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-icons text-gray-300 text-3xl">search_off</span>
                  </div>
                  <h3 className="text-base font-medium text-gray-700 mb-1">No doctors found</h3>
                  <p className="text-gray-400 text-sm mb-4">Try adjusting your filters</p>
                  <button
                    onClick={() => setDoctorFilters({ specialization: '', maxFee: '', verifiedOnly: false })}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 p-5"
                  >
                    {/* Doctor Header */}
                    <div className="flex items-start gap-3 mb-4">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(doctor.full_name)} flex items-center justify-center flex-shrink-0`}>
                        {doctor.profile_image ? (
                          <img src={doctor.profile_image} alt={doctor.full_name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-white font-medium text-sm">{getInitials(doctor.full_name)}</span>
                        )}
                      </div>

                      {/* Name & Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{doctor.full_name}</h3>
                          {doctor.is_verified && (
                            <span className="material-icons text-blue-500 text-base">verified</span>
                          )}
                        </div>
                        {doctor.specialization && (
                          <p className="text-blue-600 text-sm">{doctor.specialization}</p>
                        )}
                        <p className="text-gray-400 text-sm truncate">
                          {doctor.clinic_name || doctor.clinic_address || 'Available for consultation'}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <span className="material-icons text-gray-400 text-sm">work</span>
                        {doctor.experience_years || 0} yrs
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-icons text-amber-400 text-sm">star</span>
                        {doctor.rating || '4.5'}
                      </span>
                      {(doctor.online_fee > 0 || doctor.consultation_fee > 0) && (
                        <span className="text-green-600 text-xs">Online</span>
                      )}
                    </div>

                    {/* Price & Book */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-xl font-semibold text-gray-900">
                          Rs. {doctor.consultation_fee || doctor.online_fee || 0}
                        </p>
                        <p className="text-xs text-gray-400">per session</p>
                      </div>
                      <button
                        onClick={() => openBookingModal(doctor)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
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
                <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
                <p className="text-gray-500 mt-1">Manage and track all your medical appointments</p>
              </div>
              <button
                onClick={() => setActiveTab('doctors')}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 flex items-center gap-2"
              >
                <span className="material-icons text-lg">add</span>
                Book Appointment
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {appointments.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-icons text-gray-400 text-4xl">event_busy</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No appointments yet</h3>
                  <p className="text-gray-500 mb-6">Book your first consultation with a doctor</p>
                  <button
                    onClick={() => setActiveTab('doctors')}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
                  >
                    Find a Doctor
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="p-5 hover:bg-gray-50/50 transition-all">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        {/* Doctor Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarColor(apt.doctor?.full_name)} flex items-center justify-center shadow-md flex-shrink-0`}>
                            <span className="text-white font-bold">{getInitials(apt.doctor?.full_name)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900">{apt.doctor?.full_name || 'Doctor'}</h4>
                            <p className="text-sm text-blue-600 font-medium">{apt.doctor?.specialization}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${apt.visit_type === 'online' || apt.visit_type === 'video' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                <span className="material-icons text-xs">{apt.visit_type === 'online' || apt.visit_type === 'video' ? 'video_call' : 'location_on'}</span>
                                {apt.visit_type === 'online' || apt.visit_type === 'video' ? 'Online' : 'In-Person'}
                              </span>
                              {apt.payment_status && (
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${apt.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : apt.payment_status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                                  {apt.payment_status === 'paid' ? 'Paid' : apt.payment_status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Date, Status & Price */}
                        <div className="flex items-center gap-4 lg:gap-6">
                          <div className="text-center bg-gray-50 rounded-xl px-4 py-2">
                            <p className="font-bold text-gray-900">{new Date(apt.appointment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                            <p className="text-sm text-gray-500">{apt.start_time?.slice(0, 5)}</p>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-4 py-1.5 rounded-xl text-sm font-semibold capitalize ${getStatusBadge(apt.status)}`}>{apt.status}</span>
                            {apt.is_rescheduled && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-100 text-orange-700">
                                <span className="material-icons text-[10px]">event_repeat</span>
                                Rescheduled
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 text-lg">Rs. {apt.consultation_fee || apt.amount}</p>
                            {(apt.status === 'scheduled' || apt.status === 'pending') && (
                              <button onClick={() => handleCancelAppointment(apt.id)} className="text-red-600 text-sm font-medium hover:text-red-700 mt-1">Cancel</button>
                            )}
                            {apt.status === 'confirmed' && (apt.visit_type === 'online' || apt.visit_type === 'video') && (
                              <a href={apt.video_room_url || apt.meeting_link || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 mt-1">
                                <span className="material-icons text-xs">video_call</span>Join
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      {(apt.reason_for_visit || apt.doctor_notes) && (
                        <div className="mt-4 space-y-2">
                          {apt.reason_for_visit && (
                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                              <span className="font-semibold text-gray-700">Reason:</span> {apt.reason_for_visit}
                            </div>
                          )}
                          {apt.doctor_notes && (
                            <div className="text-sm text-blue-700 bg-blue-50 p-3 rounded-xl">
                              <span className="font-semibold">Doctor Notes:</span> {apt.doctor_notes}
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
            {/* Medical Conditions */}
            <div className="bg-white rounded-xl shadow">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Medical Conditions</h3>
                <button
                  onClick={() => setShowAddCondition(true)}
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <span className="material-icons text-sm">add</span>
                  Add Condition
                </button>
              </div>
              <div className="p-6">
                {medicalHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No medical conditions recorded</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {medicalHistory.map((condition) => (
                      <span
                        key={condition.id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-800 rounded-full"
                      >
                        {condition.condition_name}
                        <button
                          onClick={() => handleDeleteCondition(condition.id)}
                          className="hover:text-red-600"
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
            <div className="bg-white rounded-xl shadow">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Allergies</h3>
                <button
                  onClick={() => setShowAddAllergy(true)}
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <span className="material-icons text-sm">add</span>
                  Add Allergy
                </button>
              </div>
              <div className="p-6">
                {allergies.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No allergies recorded</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allergies.map((allergy) => (
                      <span
                        key={allergy.id}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getSeverityBadge(allergy.severity)}`}
                      >
                        {allergy.allergy_name}
                        <span className="text-xs">({allergy.severity})</span>
                        <button
                          onClick={() => handleDeleteAllergy(allergy.id)}
                          className="hover:text-red-600"
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
            <div className="bg-white rounded-xl shadow">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Current Medications</h3>
                <button
                  onClick={() => setShowAddMedication(true)}
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <span className="material-icons text-sm">add</span>
                  Add Medication
                </button>
              </div>
              <div className="p-6">
                {medications.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No medications recorded</p>
                ) : (
                  <div className="space-y-3">
                    {medications.map((med) => (
                      <div key={med.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{med.medication_name}</p>
                          <p className="text-sm text-gray-500">{med.dosage} - {med.frequency}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteMedication(med.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <span className="material-icons">delete</span>
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
            <div className="bg-white rounded-xl shadow p-8">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-icons text-blue-600 text-5xl">person</span>
                </div>
                {!isEditingProfile ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800">{`${patientData?.first_name || ''} ${patientData?.last_name || ''}`.trim()}</h2>
                    <p className="text-gray-500">Patient ID: PT-{patientData?.id?.slice(-6).toUpperCase()}</p>
                  </>
                ) : (
                  <h2 className="text-2xl font-bold text-gray-800">Edit Your Profile</h2>
                )}
              </div>

              {!isEditingProfile ? (
                /* View Mode */
                <>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                        <p className="text-gray-800">{patientData?.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                        <p className="text-gray-800">{patientData?.phone_number || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                        <p className="text-gray-800">
                          {patientData?.date_of_birth
                            ? new Date(patientData.date_of_birth).toLocaleDateString()
                            : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Gender</label>
                        <p className="text-gray-800 capitalize">{patientData?.gender || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Blood Group</label>
                        <p className="text-gray-800">{patientData?.blood_group || 'Unknown'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Height</label>
                        <p className="text-gray-800">{patientData?.height_cm ? `${patientData.height_cm} cm` : 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Weight</label>
                        <p className="text-gray-800">{patientData?.weight_kg ? `${patientData.weight_kg} kg` : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <button
                      onClick={handleEditProfile}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      <span className="material-icons text-sm align-middle mr-2">edit</span>
                      Edit Profile
                    </button>
                  </div>
                </>
              ) : (
                /* Edit Mode */
                <>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input
                          type="text"
                          value={editProfileData.first_name}
                          onChange={(e) => setEditProfileData({...editProfileData, first_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={editProfileData.last_name}
                          onChange={(e) => setEditProfileData({...editProfileData, last_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={patientData?.email || ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={editProfileData.phone_number}
                          onChange={(e) => setEditProfileData({...editProfileData, phone_number: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={editProfileData.date_of_birth}
                          onChange={(e) => setEditProfileData({...editProfileData, date_of_birth: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select
                          value={editProfileData.gender}
                          onChange={(e) => setEditProfileData({...editProfileData, gender: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                        <select
                          value={editProfileData.blood_group}
                          onChange={(e) => setEditProfileData({...editProfileData, blood_group: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                        <input
                          type="number"
                          value={editProfileData.height_cm}
                          onChange={(e) => setEditProfileData({...editProfileData, height_cm: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 170"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          value={editProfileData.weight_kg}
                          onChange={(e) => setEditProfileData({...editProfileData, weight_kg: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 65"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
                    <button
                      onClick={handleCancelEdit}
                      disabled={savingProfile}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-400"
                    >
                      {savingProfile ? (
                        <>
                          <span className="material-icons text-sm align-middle mr-2 animate-spin">sync</span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="material-icons text-sm align-middle mr-2">save</span>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal - Multi-Step Flow */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  {bookingStep === 1 && 'Select Visit Type'}
                  {bookingStep === 2 && 'Choose Date & Time'}
                  {bookingStep === 3 && 'Payment'}
                  {bookingStep === 4 && 'Booking Confirmed'}
                </h3>
                <button onClick={closeBookingModal} className="text-gray-400 hover:text-gray-600">
                  <span className="material-icons">close</span>
                </button>
              </div>

              {/* Progress Steps */}
              {bookingStep < 4 && (
                <div className="flex items-center justify-between mt-4">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        bookingStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {bookingStep > step ? (
                          <span className="material-icons text-sm">check</span>
                        ) : step}
                      </div>
                      {step < 3 && (
                        <div className={`w-16 h-1 mx-2 ${bookingStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Doctor Info Card */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                  {selectedDoctor.profile_image ? (
                    <img src={selectedDoctor.profile_image} alt={selectedDoctor.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-icons text-blue-600 text-2xl">person</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{selectedDoctor.full_name}</p>
                  <p className="text-sm text-blue-600">{selectedDoctor.specialization}</p>
                  <p className="text-sm text-gray-500">{selectedDoctor.clinic_name || selectedDoctor.clinic_address || ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-800">Rs. {bookingData.visitType === 'online' ? (selectedDoctor.online_fee || selectedDoctor.consultation_fee) : (selectedDoctor.consultation_fee || selectedDoctor.online_fee) || 0}</p>
                  <p className="text-xs text-gray-500">per session</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Step 1: Visit Type Selection */}
              {bookingStep === 1 && (
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">How would you like to consult with the doctor?</p>

                  <button
                    onClick={() => {
                      setBookingData({ ...bookingData, visitType: 'online' });
                      setBookingStep(2);
                    }}
                    className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition">
                        <span className="material-icons text-blue-600 text-3xl">video_call</span>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-bold text-gray-800 text-lg">Online Consultation</p>
                        <p className="text-sm text-gray-500">Video call from the comfort of your home</p>
                      </div>
                      <span className="material-icons text-gray-400 group-hover:text-blue-600">arrow_forward</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setBookingData({ ...bookingData, visitType: 'physical' });
                      setBookingStep(2);
                    }}
                    className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition">
                        <span className="material-icons text-green-600 text-3xl">local_hospital</span>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-bold text-gray-800 text-lg">Physical Visit</p>
                        <p className="text-sm text-gray-500">Visit the clinic/hospital in person</p>
                      </div>
                      <span className="material-icons text-gray-400 group-hover:text-green-600">arrow_forward</span>
                    </div>
                  </button>

                  <p className="text-center text-sm text-gray-400 mt-4">
                    Same consultation fee for both visit types
                  </p>
                </div>
              )}

              {/* Step 2: Date, Time & Details */}
              {bookingStep === 2 && (
                <div className="space-y-4">
                  {/* Visit Type Badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    bookingData.visitType === 'online'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    <span className="material-icons text-sm">
                      {bookingData.visitType === 'online' ? 'video_call' : 'local_hospital'}
                    </span>
                    {bookingData.visitType === 'online' ? 'Online Consultation' : 'Physical Visit'}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                    <input
                      type="date"
                      value={bookingData.date}
                      onChange={(e) => {
                        setBookingData({ ...bookingData, date: e.target.value, time: '' });
                        loadAvailableSlots(e.target.value);
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {bookingData.date && slotsLoading && (
                    <div className="flex items-center justify-center py-6 gap-3">
                      <span className="material-icons text-blue-500 animate-spin text-xl">autorenew</span>
                      <p className="text-sm text-gray-500">Loading available slots...</p>
                    </div>
                  )}

                  {bookingData.date && !slotsLoading && availableSlots.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
                      <div className="grid grid-cols-4 gap-2">
                        {availableSlots.map((slot, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setBookingData({ ...bookingData, time: slot.start_time || slot.time_slot_start })}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                              bookingData.time === (slot.start_time || slot.time_slot_start)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {(slot.start_time || slot.time_slot_start).slice(0, 5)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {bookingData.date && !slotsLoading && availableSlots.length === 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm font-medium">
                        Doctor is not available on this date. Please select a different date.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit</label>
                    <input
                      type="text"
                      value={bookingData.reason}
                      onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief reason for consultation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms (Optional)</label>
                    <textarea
                      value={bookingData.symptoms}
                      onChange={(e) => setBookingData({ ...bookingData, symptoms: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Describe your symptoms"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setBookingStep(1)}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreateAppointment}
                      disabled={!bookingData.date || !bookingData.time}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {bookingStep === 3 && createdAppointment && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="font-bold text-gray-800 mb-4">Booking Summary</h4>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Visit Type</span>
                        <span className="font-medium text-gray-800 capitalize">
                          {bookingData.visitType === 'online' ? 'Online Consultation' : 'Physical Visit'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date</span>
                        <span className="font-medium text-gray-800">
                          {new Date(bookingData.date).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time</span>
                        <span className="font-medium text-gray-800">{bookingData.time}</span>
                      </div>
                      {bookingData.reason && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Reason</span>
                          <span className="font-medium text-gray-800">{bookingData.reason}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 mt-4 pt-4">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold text-gray-800">Total Amount</span>
                        <span className="font-bold text-blue-600">Rs. {bookingData.visitType === 'online' ? (selectedDoctor.online_fee || selectedDoctor.consultation_fee || 0) : (selectedDoctor.consultation_fee || selectedDoctor.online_fee || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dummy Payment Card */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="material-icons text-blue-600">credit_card</span>
                      Payment Method
                    </h4>
                    <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white">
                      <div className="flex justify-between items-start mb-8">
                        <span className="material-icons text-3xl opacity-80">credit_card</span>
                        <span className="text-sm opacity-80">VISA</span>
                      </div>
                      <p className="font-mono text-lg tracking-wider mb-2">**** **** **** 4242</p>
                      <div className="flex justify-between text-sm opacity-80">
                        <span>Demo Card</span>
                        <span>12/28</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-3 text-center">
                      This is a demo payment. No actual charge will be made.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setBookingStep(2)}
                      disabled={processingPayment}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={processingPayment}
                      className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                    >
                      {processingPayment ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <span className="material-icons text-sm">lock</span>
                          Pay Rs. {bookingData.visitType === 'online' ? (selectedDoctor.online_fee || selectedDoctor.consultation_fee || 0) : (selectedDoctor.consultation_fee || selectedDoctor.online_fee || 0)}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {bookingStep === 4 && createdAppointment && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-icons text-green-600 text-4xl">check_circle</span>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h4>
                  <p className="text-gray-500 mb-6">Your appointment has been successfully booked and paid.</p>

                  <div className="bg-gray-50 rounded-xl p-6 text-left mb-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          bookingData.visitType === 'online' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          <span className={`material-icons ${
                            bookingData.visitType === 'online' ? 'text-blue-600' : 'text-green-600'
                          }`}>
                            {bookingData.visitType === 'online' ? 'video_call' : 'local_hospital'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {bookingData.visitType === 'online' ? 'Online Consultation' : 'Physical Visit'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {bookingData.visitType === 'online'
                              ? 'Video call link will be sent before appointment'
                              : 'Visit the clinic at the scheduled time'}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Date</span>
                        <span className="font-medium text-gray-800">
                          {new Date(bookingData.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time</span>
                        <span className="font-medium text-gray-800">{bookingData.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Doctor</span>
                        <span className="font-medium text-gray-800">{selectedDoctor.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Specialization</span>
                        <span className="font-medium text-gray-800">{selectedDoctor.specialization}</span>
                      </div>

                      {/* Clinic Address for Physical Visit */}
                      {bookingData.visitType === 'physical' && (
                        <div className="pt-4 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">Clinic Address</p>
                          <div className="flex items-start gap-2 text-gray-600">
                            <span className="material-icons text-green-600 text-lg">location_on</span>
                            <p className="text-sm">
                              {selectedDoctor.clinic_name || selectedDoctor.clinic_address || 'Address will be provided via SMS/Email'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Video Link for Online Visit */}
                      {bookingData.visitType === 'online' && (
                        <div className="pt-4 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">Video Consultation</p>
                          <div className="flex items-start gap-2 text-gray-600">
                            <span className="material-icons text-blue-600 text-lg">videocam</span>
                            <p className="text-sm">
                              {createdAppointment.video_room_url || createdAppointment.meeting_link ||
                               'Video call link will be sent to your email/phone before the appointment'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Payment Status */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Payment Status</span>
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            <span className="material-icons text-sm">check_circle</span>
                            PAID
                          </span>
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-gray-600">Amount Paid</span>
                          <span className="font-bold text-gray-800">Rs. {createdAppointment.amount || (bookingData.visitType === 'online' ? (selectedDoctor.online_fee || selectedDoctor.consultation_fee || 0) : (selectedDoctor.consultation_fee || selectedDoctor.online_fee || 0))}</span>
                        </div>
                        {createdAppointment.payment_id && (
                          <div className="flex justify-between mt-2">
                            <span className="text-gray-600">Transaction ID</span>
                            <span className="font-mono text-sm text-gray-800">{createdAppointment.payment_id}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        closeBookingModal();
                        setActiveTab('home');
                      }}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      Go to Dashboard
                    </button>
                    <button
                      onClick={() => {
                        closeBookingModal();
                        setActiveTab('appointments');
                      }}
                      className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                    >
                      View My Appointments
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Condition Modal */}
      {showAddCondition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Medical Condition</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newCondition.conditionName}
                onChange={(e) => setNewCondition({ ...newCondition, conditionName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Condition name"
              />
              <select
                value={newCondition.conditionType}
                onChange={(e) => setNewCondition({ ...newCondition, conditionType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              >
                <option value="current">Current</option>
                <option value="past">Past</option>
                <option value="family_history">Family History</option>
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddCondition(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCondition}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Allergy</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newAllergy.allergyName}
                onChange={(e) => setNewAllergy({ ...newAllergy, allergyName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Allergy name"
              />
              <select
                value={newAllergy.allergyType}
                onChange={(e) => setNewAllergy({ ...newAllergy, allergyType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              >
                <option value="drug">Drug</option>
                <option value="food">Food</option>
                <option value="environmental">Environmental</option>
                <option value="other">Other</option>
              </select>
              <select
                value={newAllergy.severity}
                onChange={(e) => setNewAllergy({ ...newAllergy, severity: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="life_threatening">Life Threatening</option>
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddAllergy(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAllergy}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Medication</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newMedication.medicationName}
                onChange={(e) => setNewMedication({ ...newMedication, medicationName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Medication name"
              />
              <input
                type="text"
                value={newMedication.dosage}
                onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Dosage (e.g., 500mg)"
              />
              <input
                type="text"
                value={newMedication.frequency}
                onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Frequency (e.g., Twice daily)"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddMedication(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMedication}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Doctor Details</h3>
                <button onClick={closeDoctorDetailModal} className="text-gray-400 hover:text-gray-600">
                  <span className="material-icons">close</span>
                </button>
              </div>
            </div>

            {/* Doctor Info */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="material-icons text-3xl text-blue-600">person</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-800">{selectedAppointment.doctor?.full_name}</h4>
                  <p className="text-gray-500">{selectedAppointment.doctor?.specialization}</p>
                  <p className="text-sm text-gray-400">{selectedAppointment.doctor?.clinic_name}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <div className="bg-blue-50 px-3 py-2 rounded-lg">
                  <span className="text-gray-500">Appointment: </span>
                  <span className="font-medium">{new Date(selectedAppointment.appointment_date).toLocaleDateString()}</span>
                </div>
                <div className="bg-green-50 px-3 py-2 rounded-lg">
                  <span className="text-gray-500">Status: </span>
                  <span className="font-medium capitalize">{selectedAppointment.status}</span>
                </div>
              </div>
            </div>

            {/* Prescriptions from Doctor Section */}
            <div className="p-6 border-b border-gray-100">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="material-icons text-green-600">medical_services</span>
                Documents from Doctor ({doctorPrescriptions.length})
              </h4>
              {doctorPrescriptions.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <span className="material-icons text-4xl mb-2">receipt_long</span>
                  <p>No documents uploaded by doctor yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {doctorPrescriptions.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="material-icons text-green-600">description</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{doc.file_name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                              {doc.file_type}
                            </span>
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                          {doc.description && (
                            <p className="text-xs text-gray-600 mt-1">{doc.description}</p>
                          )}
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
                              console.error('Error opening document:', err, 'Path:', doc.file_url);
                              alert('Error opening document. Please ask your doctor to re-upload.');
                            }
                          }}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition"
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
                              console.error('Error downloading document:', err, 'Path:', doc.file_url);
                              alert('Error downloading document. Please ask your doctor to re-upload.');
                            }
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
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
            <div className="p-6 border-b border-gray-100">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="material-icons text-blue-600">upload_file</span>
                Upload Document for Doctor
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                  <select
                    value={documentUploadData.documentType}
                    onChange={(e) => setDocumentUploadData({ ...documentUploadData, documentType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="lab_report">Lab Report</option>
                    <option value="prescription">Prescription</option>
                    <option value="scan">Scan / X-Ray</option>
                    <option value="medical_certificate">Medical Certificate</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    value={documentUploadData.description}
                    onChange={(e) => setDocumentUploadData({ ...documentUploadData, description: e.target.value })}
                    placeholder="Brief description of the document..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                  <input
                    type="file"
                    onChange={handleDocumentUpload}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    disabled={uploadingDocument}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploadingDocument && (
                    <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
                      <span className="material-icons animate-spin">refresh</span>
                      Uploading...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Uploaded Documents List */}
            <div className="p-6">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="material-icons text-purple-600">folder</span>
                Documents Shared with This Doctor ({doctorDocuments.length})
              </h4>
              {doctorDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="material-icons text-4xl mb-2">folder_open</span>
                  <p>No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {doctorDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="material-icons text-gray-400">description</span>
                        <div>
                          <p className="font-medium text-gray-800">{doc.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {doc.file_type} - {new Date(doc.created_at).toLocaleDateString()}
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
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <span className="material-icons">visibility</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="p-6 border-t border-gray-100">
              <button
                onClick={closeDoctorDetailModal}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-8 pb-4 pt-6">
        <div className="text-center">
          <p className="text-xs text-gray-400">v1.8 - 2026-01-29</p>
        </div>
      </footer>
    </div>
  );
};

export default PatientPortal;
