import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const TelecallerDashboard = () => {
  const navigate = useNavigate();
  const { signOut, user, userProfile } = useAuth();
  const [consultationQueue, setConsultationQueue] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [stats, setStats] = useState({
    todayConsultations: 0,
    pendingAssignments: 0,
    completedToday: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchConsultationQueue();
    fetchAvailableDoctors();
    fetchTodayStats();
  }, []);

  const fetchConsultationQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          patient:patient_id (full_name, phone, email),
          doctor:doctor_id (full_name, specialization)
        `)
        .in('status', ['pending', 'assigned'])
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) throw error;
      setConsultationQueue(data || []);
    } catch (error) {
      console.error('Error fetching consultation queue:', error);
      // Mock data for development
      setConsultationQueue([
        {
          id: '1',
          consultation_id: 'EMG-001',
          patient: { full_name: 'Rajesh Kumar', phone: '+91 9876543210', email: 'rajesh@email.com' },
          priority_level: 'emergency',
          patient_symptoms: 'Chest pain and breathing difficulty',
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          consultation_id: 'EMG-002',
          patient: { full_name: 'Priya Sharma', phone: '+91 9876543211', email: 'priya@email.com' },
          priority_level: 'routine',
          patient_symptoms: 'Fever and headache for 2 days',
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          consultation_id: 'EMG-003',
          patient: { full_name: 'Amit Singh', phone: '+91 9876543212', email: 'amit@email.com' },
          priority_level: 'follow_up',
          patient_symptoms: 'Follow-up for diabetes medication',
          status: 'assigned',
          doctor: { full_name: 'Dr. Karan Malhotra', specialization: 'General Medicine' },
          created_at: new Date().toISOString()
        }
      ]);
    }
  };

  const fetchAvailableDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doc_doctors')
        .select('*')
        .or('role.eq.doctor,role.is.null') // Exclude superadmins
        .order('full_name', { ascending: true });

      if (error) throw error;
      setAvailableDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      // Mock data for development
      setAvailableDoctors([
        {
          id: '1',
          full_name: 'Dr. Amit Kumar',
          specialization: 'Cardiology',
          experience_years: 12,
          consultation_fee: 500,
          is_verified: true
        },
        {
          id: '2',
          full_name: 'Dr. Priya Sharma',
          specialization: 'Pediatrics',
          experience_years: 8,
          consultation_fee: 400,
          is_verified: true
        },
        {
          id: '3',
          full_name: 'Dr. Karan Malhotra',
          specialization: 'General Medicine',
          experience_years: 15,
          consultation_fee: 350,
          is_verified: true
        }
      ]);
    }
  };

  const fetchTodayStats = async () => {
    // Mock stats for development
    setStats({
      todayConsultations: 25,
      pendingAssignments: 8,
      completedToday: 17,
      totalRevenue: 8750
    });
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAssignDoctor = (consultation) => {
    setSelectedRequest(consultation);
    setShowAssignModal(true);
  };

  const confirmDoctorAssignment = async (doctorId) => {
    try {
      // Update consultation with assigned doctor
      const { error } = await supabase
        .from('consultations')
        .update({
          doctor_id: doctorId,
          telecaller_id: user.id,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Refresh the queue
      fetchConsultationQueue();
      setShowAssignModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error assigning doctor:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'routine': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'follow_up': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading telecaller dashboard...</p>
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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">📞</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">AidocCall Telecaller Portal</h1>
                <p className="text-sm text-gray-500">Medical Consultation Coordination</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-gray-800">{userProfile?.full_name}</p>
                <p className="text-sm text-gray-500">Telecaller ID: TC{userProfile?.employee_id || '001'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Today's Consultations</p>
                <p className="text-2xl font-bold text-blue-600">{stats.todayConsultations}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Assignments</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingAssignments}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Revenue Today</p>
                <p className="text-2xl font-bold text-purple-600">₹{stats.totalRevenue}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Consultation Queue */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Consultation Queue</h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {consultationQueue.length} Requests
              </span>
            </div>

            <div className="space-y-4">
              {consultationQueue.map((consultation) => (
                <div
                  key={consultation.id}
                  className={`border rounded-lg p-4 ${
                    consultation.priority_level === 'emergency' 
                      ? 'border-red-300 bg-red-50' 
                      : consultation.priority_level === 'routine'
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-green-300 bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-800">
                        {consultation.consultation_id}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(consultation.priority_level)}`}>
                        {consultation.priority_level.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                        {consultation.status.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(consultation.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">{consultation.patient?.full_name}</h3>
                      <p className="text-sm text-gray-600">{consultation.patient?.phone}</p>
                      <p className="text-sm text-gray-600">{consultation.patient?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">
                        <strong>Symptoms:</strong> {consultation.patient_symptoms}
                      </p>
                      {consultation.doctor && (
                        <p className="text-sm text-green-700 mt-1">
                          <strong>Assigned:</strong> {consultation.doctor.full_name} ({consultation.doctor.specialization})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {consultation.status === 'pending' && (
                      <button
                        onClick={() => handleAssignDoctor(consultation)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                      >
                        Assign Doctor
                      </button>
                    )}
                    <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                      View Details
                    </button>
                    <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                      Call Patient
                    </button>
                  </div>
                </div>
              ))}

              {consultationQueue.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-4 block">📋</span>
                  <p>No consultation requests in queue</p>
                </div>
              )}
            </div>
          </div>

          {/* Available Doctors */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Available Doctors</h2>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {availableDoctors.length} Online
              </span>
            </div>

            <div className="space-y-4">
              {availableDoctors.map((doctor) => (
                <div key={doctor.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{doctor.full_name}</h3>
                    {doctor.is_verified && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{doctor.specialization}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{doctor.experience_years || 0} yrs experience</span>
                    <span>₹{doctor.consultation_fee || doctor.online_fee || 0}</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 border-2 border-dashed border-gray-300 text-gray-600 py-3 rounded-lg hover:border-blue-400 hover:text-blue-600 transition">
              + Search External Doctors
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>v1.2 - 2026-01-17</p>
        </div>
      </div>

      {/* Doctor Assignment Modal */}
      {showAssignModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Assign Doctor to {selectedRequest.patient?.full_name}
            </h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Symptoms:</strong> {selectedRequest.patient_symptoms}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Priority:</strong> 
                <span className={`ml-1 px-2 py-1 rounded-full text-xs ${getPriorityColor(selectedRequest.priority_level)}`}>
                  {selectedRequest.priority_level.toUpperCase()}
                </span>
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {availableDoctors.map((doctor) => (
                <div 
                  key={doctor.id} 
                  className="border rounded-lg p-3 hover:bg-blue-50 cursor-pointer"
                  onClick={() => confirmDoctorAssignment(doctor.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">{doctor.full_name}</h4>
                      <p className="text-sm text-gray-600">{doctor.specialization}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">₹{doctor.consultation_fee}</p>
                      <p className="text-xs text-gray-500">{doctor.current_patient_load}/{doctor.max_patient_load}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition">
                External Doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelecallerDashboard;