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
  getDoctorAvailability
} from '../../services/patientService';
import { supabase } from '../../lib/supabaseClient';

const PatientPortal = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);

  // Tab-specific state
  const [doctors, setDoctors] = useState([]);
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
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Add forms
  const [showAddCondition, setShowAddCondition] = useState(false);
  const [showAddAllergy, setShowAddAllergy] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [newCondition, setNewCondition] = useState({ conditionName: '', conditionType: 'current', notes: '' });
  const [newAllergy, setNewAllergy] = useState({ allergyName: '', allergyType: 'drug', severity: 'moderate' });
  const [newMedication, setNewMedication] = useState({ medicationName: '', dosage: '', frequency: '' });

  useEffect(() => {
    loadPatientData();
  }, [user]);

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
        // Patient profile not found - redirect to registration
        navigate('/patient/register');
        return;
      }

      if (!data.registration_completed) {
        // Registration not completed - redirect to continue
        navigate('/patient/register');
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
      const data = await searchDoctors(doctorFilters);
      setDoctors(data);
    } catch (error) {
      console.error('Error loading doctors:', error);
      // Mock data fallback
      setDoctors([
        { id: '1', full_name: 'Dr. Amit Kumar', specialization: 'Cardiology', hospital_affiliation: 'AIIMS Delhi', rating: 4.8, consultation_fee: 500, is_verified_green_flag: true, status: 'active' },
        { id: '2', full_name: 'Dr. Priya Sharma', specialization: 'Pediatrics', hospital_affiliation: 'Apollo Hospital', rating: 4.9, consultation_fee: 400, is_verified_green_flag: true, status: 'active' },
        { id: '3', full_name: 'Dr. Karan Singh', specialization: 'General Medicine', hospital_affiliation: 'Fortis Hospital', rating: 4.7, consultation_fee: 350, is_verified_green_flag: true, status: 'active' }
      ]);
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
    try {
      const slots = await getDoctorAvailability(selectedDoctor.id, date);
      if (slots.length > 0) {
        setAvailableSlots(slots);
      } else {
        // Generate default slots if no availability configured
        const defaultSlots = [];
        for (let hour = 9; hour < 18; hour++) {
          defaultSlots.push({ start_time: `${hour.toString().padStart(2, '0')}:00`, end_time: `${(hour + 1).toString().padStart(2, '0')}:00` });
        }
        setAvailableSlots(defaultSlots);
      }
    } catch (error) {
      // Generate default slots on error
      const defaultSlots = [];
      for (let hour = 9; hour < 18; hour++) {
        defaultSlots.push({ start_time: `${hour.toString().padStart(2, '0')}:00`, end_time: `${(hour + 1).toString().padStart(2, '0')}:00` });
      }
      setAvailableSlots(defaultSlots);
    }
  };

  const handleCreateAppointment = async () => {
    if (!selectedDoctor || !bookingData.date || !bookingData.time || !bookingData.visitType) return;

    try {
      const appointment = await createAppointment(patientData.id, {
        doctorId: selectedDoctor.id,
        patientName: patientData.full_name,
        patientEmail: patientData.email,
        patientPhone: patientData.phone,
        appointmentDate: bookingData.date,
        appointmentTime: bookingData.time,
        visitType: bookingData.visitType,
        reasonForVisit: bookingData.reason,
        symptoms: bookingData.symptoms,
        consultationFee: selectedDoctor.consultation_fee
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
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
                <span className="material-icons text-white text-2xl">local_hospital</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">AidocCall</h1>
                <p className="text-sm text-gray-500">Patient Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-gray-800">{patientData?.full_name}</p>
                <p className="text-sm text-gray-500">ID: PT-{patientData?.id?.slice(-6).toUpperCase()}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                <span className="material-icons text-sm">logout</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6">
          <div className="flex space-x-1">
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
                className={`flex items-center gap-2 py-4 px-4 border-b-2 font-medium text-sm transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="material-icons text-xl">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Welcome back, {patientData?.full_name?.split(' ')[0]}!</h2>
              <p className="opacity-90">Your health dashboard is ready. Book appointments, manage records, and stay healthy.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="material-icons text-blue-600">event</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{upcomingAppointments.length}</p>
                    <p className="text-sm text-gray-500">Upcoming Appointments</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <span className="material-icons text-green-600">verified</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{patientData?.blood_group || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Blood Group</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <span className="material-icons text-purple-600">medical_services</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">Active</p>
                    <p className="text-sm text-gray-500">Account Status</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Upcoming Appointments</h3>
                <button
                  onClick={() => setActiveTab('doctors')}
                  className="text-blue-600 text-sm font-medium hover:underline"
                >
                  Book New
                </button>
              </div>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="material-icons text-4xl mb-2">event_busy</span>
                  <p>No upcoming appointments</p>
                  <button
                    onClick={() => setActiveTab('doctors')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Find a Doctor
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.slice(0, 3).map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="material-icons text-blue-600">person</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{apt.doctor?.full_name}</p>
                          <p className="text-sm text-gray-500">{apt.doctor?.specialization}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-800">
                          {new Date(apt.appointment_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">{apt.appointment_time}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setActiveTab('doctors')}
                className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition"
              >
                <span className="material-icons text-3xl text-blue-600 mb-2">search</span>
                <p className="font-medium text-gray-800">Find Doctor</p>
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition"
              >
                <span className="material-icons text-3xl text-green-600 mb-2">calendar_today</span>
                <p className="font-medium text-gray-800">My Appointments</p>
              </button>
              <button
                onClick={() => setActiveTab('records')}
                className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition"
              >
                <span className="material-icons text-3xl text-purple-600 mb-2">folder</span>
                <p className="font-medium text-gray-800">Medical Records</p>
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-red-50 rounded-xl shadow p-4 text-center hover:shadow-lg transition border-2 border-red-200"
              >
                <span className="material-icons text-3xl text-red-600 mb-2">emergency</span>
                <p className="font-medium text-red-700">Emergency</p>
              </button>
            </div>
          </div>
        )}

        {/* Doctors Tab */}
        {activeTab === 'doctors' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-bold text-gray-800 mb-4">Find the Right Doctor</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={doctorFilters.specialization}
                  onChange={(e) => setDoctorFilters({ ...doctorFilters, specialization: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Specializations</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Gynecology">Gynecology</option>
                  <option value="Neurology">Neurology</option>
                </select>
                <select
                  value={doctorFilters.maxFee}
                  onChange={(e) => setDoctorFilters({ ...doctorFilters, maxFee: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Fee</option>
                  <option value="300">Under Rs. 300</option>
                  <option value="500">Under Rs. 500</option>
                  <option value="1000">Under Rs. 1000</option>
                </select>
                <label className="flex items-center gap-2 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={doctorFilters.verifiedOnly}
                    onChange={(e) => setDoctorFilters({ ...doctorFilters, verifiedOnly: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">Verified Only</span>
                </label>
                <button
                  onClick={loadDoctors}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <span className="material-icons text-sm align-middle mr-1">search</span>
                  Search
                </button>
              </div>
            </div>

            {/* Doctor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="bg-white rounded-xl shadow hover:shadow-lg transition p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="material-icons text-blue-600 text-2xl">person</span>
                    </div>
                    {doctor.is_verified_green_flag && (
                      <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                        <span className="material-icons text-sm">verified</span>
                        Verified
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{doctor.full_name}</h3>
                  <p className="text-blue-600 font-medium">{doctor.specialization}</p>
                  <p className="text-sm text-gray-500 mb-4">{doctor.hospital_affiliation}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <span className="material-icons text-yellow-500 text-sm">star</span>
                      <span className="font-medium">{doctor.rating || 4.5}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-800">Rs. {doctor.consultation_fee}</p>
                      <p className="text-xs text-gray-500">per session</p>
                    </div>
                  </div>

                  <button
                    onClick={() => openBookingModal(doctor)}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <span className="material-icons text-sm">calendar_today</span>
                    Book Consultation
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">My Appointments</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {appointments.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <span className="material-icons text-5xl mb-3">event_busy</span>
                    <p className="mb-4">No appointments yet</p>
                    <button
                      onClick={() => setActiveTab('doctors')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Book Your First Appointment
                    </button>
                  </div>
                ) : (
                  appointments.map((apt) => (
                    <div key={apt.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            apt.visit_type === 'online' || apt.visit_type === 'video'
                              ? 'bg-blue-100'
                              : 'bg-green-100'
                          }`}>
                            <span className={`material-icons ${
                              apt.visit_type === 'online' || apt.visit_type === 'video'
                                ? 'text-blue-600'
                                : 'text-green-600'
                            }`}>
                              {apt.visit_type === 'online' || apt.visit_type === 'video' ? 'video_call' : 'local_hospital'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">{apt.doctor?.full_name || 'Doctor'}</h4>
                            <p className="text-sm text-gray-500">{apt.doctor?.specialization}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                apt.visit_type === 'online' || apt.visit_type === 'video'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                <span className="material-icons text-xs">
                                  {apt.visit_type === 'online' || apt.visit_type === 'video' ? 'video_call' : 'location_on'}
                                </span>
                                {apt.visit_type === 'online' || apt.visit_type === 'video' ? 'Online' : 'Physical'}
                              </span>
                              {apt.payment_status && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  apt.payment_status === 'paid'
                                    ? 'bg-green-100 text-green-700'
                                    : apt.payment_status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {apt.payment_status === 'paid' ? 'Paid' : apt.payment_status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-gray-800">
                            {new Date(apt.appointment_date).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-gray-500">{apt.appointment_time}</p>
                        </div>
                        <div className="text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(apt.status)}`}>
                            {apt.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">Rs. {apt.consultation_fee || apt.amount}</p>
                          {(apt.status === 'scheduled' || apt.status === 'pending') && (
                            <button
                              onClick={() => handleCancelAppointment(apt.id)}
                              className="mt-2 text-red-600 text-sm hover:underline"
                            >
                              Cancel
                            </button>
                          )}
                          {apt.status === 'confirmed' && (apt.visit_type === 'online' || apt.visit_type === 'video') && (
                            <a
                              href={apt.video_room_url || apt.meeting_link || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-blue-600 text-sm hover:underline"
                            >
                              <span className="material-icons text-sm">video_call</span>
                              Join Call
                            </a>
                          )}
                          {apt.status === 'confirmed' && apt.visit_type === 'physical' && (
                            <p className="mt-2 text-xs text-gray-500">
                              <span className="material-icons text-xs align-middle">location_on</span>
                              {apt.doctor?.clinic_address || apt.doctor?.hospital_affiliation || 'Clinic'}
                            </p>
                          )}
                        </div>
                      </div>
                      {apt.reason_for_visit && (
                        <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <strong>Reason:</strong> {apt.reason_for_visit}
                        </p>
                      )}
                      {apt.doctor_notes && (
                        <p className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                          <strong>Doctor Notes:</strong> {apt.doctor_notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
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
                <h2 className="text-2xl font-bold text-gray-800">{patientData?.full_name}</h2>
                <p className="text-gray-500">Patient ID: PT-{patientData?.id?.slice(-6).toUpperCase()}</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                    <p className="text-gray-800">{patientData?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                    <p className="text-gray-800">{patientData?.phone || 'Not provided'}</p>
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
                <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                  <span className="material-icons text-sm align-middle mr-2">edit</span>
                  Edit Profile
                </button>
              </div>
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
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="material-icons text-blue-600 text-2xl">person</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{selectedDoctor.full_name}</p>
                  <p className="text-sm text-blue-600">{selectedDoctor.specialization}</p>
                  <p className="text-sm text-gray-500">{selectedDoctor.hospital_affiliation}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-800">Rs. {selectedDoctor.consultation_fee}</p>
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

                  {bookingData.date && availableSlots.length > 0 && (
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
                        <span className="font-bold text-blue-600">Rs. {selectedDoctor.consultation_fee}</span>
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
                          Pay Rs. {selectedDoctor.consultation_fee}
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
                              {selectedDoctor.clinic_address || selectedDoctor.hospital_affiliation || 'Address will be provided via SMS/Email'}
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
                          <span className="font-bold text-gray-800">Rs. {selectedDoctor.consultation_fee}</span>
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

                  <button
                    onClick={closeBookingModal}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    Done
                  </button>
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

      {/* Footer */}
      <div className="py-6 text-center text-sm text-gray-400">
        v1.3 - 2026-01-10
      </div>
    </div>
  );
};

export default PatientPortal;
