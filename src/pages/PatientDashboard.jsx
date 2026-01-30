import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { signOut, user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('discover');
  const [nearbyDoctors, setNearbyDoctors] = useState([]);
  const [myConsultations, setMyConsultations] = useState([]);
  const [myDocuments, setMyDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState({
    specialization: '',
    location: '',
    priceRange: ''
  });

  useEffect(() => {
    fetchNearbyDoctors();
    fetchMyConsultations();
    fetchMyDocuments();
  }, []);

  const fetchNearbyDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doc_doctors')
        .select('*')
        .or('role.eq.doctor,role.is.null') // Exclude superadmins
        .order('full_name', { ascending: true });

      if (error) throw error;
      setNearbyDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      // Mock data for development
      setNearbyDoctors([
        {
          id: '1',
          full_name: 'Dr. Amit Kumar',
          specialization: 'Cardiology',
          clinic_name: 'AIIMS Delhi',
          experience_years: 12,
          consultation_fee: 500,
          is_verified: true
        },
        {
          id: '2',
          full_name: 'Dr. Priya Sharma',
          specialization: 'Pediatrics',
          clinic_name: 'Apollo Hospital',
          experience_years: 8,
          consultation_fee: 400,
          is_verified: true
        },
        {
          id: '3',
          full_name: 'Dr. Karan Malhotra',
          specialization: 'General Medicine',
          clinic_name: 'Fortis Hospital',
          experience_years: 15,
          consultation_fee: 350,
          is_verified: true
        },
        {
          id: '4',
          full_name: 'Dr. Neha Agarwal',
          specialization: 'Dermatology',
          clinic_name: 'Max Hospital',
          experience_years: 6,
          consultation_fee: 450,
          is_verified: true
        }
      ]);
    }
  };

  const fetchMyConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          doctor:doctor_id (full_name, specialization)
        `)
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
      // Mock data
      setMyConsultations([
        {
          id: '1',
          consultation_id: 'EMG-001',
          doctor: { full_name: 'Dr. Amit Kumar', specialization: 'Cardiology' },
          status: 'completed',
          appointment_time: new Date(Date.now() - 86400000).toISOString(),
          total_amount: 500,
          doctor_notes: 'Blood pressure normal. Continue current medication.'
        },
        {
          id: '2',
          consultation_id: 'EMG-002',
          doctor: { full_name: 'Dr. Priya Sharma', specialization: 'Pediatrics' },
          status: 'scheduled',
          appointment_time: new Date(Date.now() + 86400000).toISOString(),
          total_amount: 400
        }
      ]);
    }
  };

  const fetchMyDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_documents')
        .select('*')
        .eq('patient_id', user?.id)
        .order('uploaded_date', { ascending: false });

      if (error) throw error;
      setMyDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      // Mock data
      setMyDocuments([
        {
          id: '1',
          document_type: 'lab_report',
          file_name: 'blood_test_report.pdf',
          uploaded_date: new Date().toISOString(),
          description: 'Complete Blood Count Test'
        },
        {
          id: '2',
          document_type: 'prescription',
          file_name: 'heart_medication.pdf',
          uploaded_date: new Date(Date.now() - 86400000).toISOString(),
          description: 'Cardiac medication prescription'
        }
      ]);
    }
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

  const handleBookConsultation = async (doctorId) => {
    try {
      // Create consultation request
      const consultationId = `CON-${Date.now()}`;
      
      const { error } = await supabase
        .from('consultations')
        .insert({
          consultation_id: consultationId,
          patient_id: user.id,
          doctor_id: doctorId,
          status: 'pending',
          priority_level: 'routine',
          consultation_type: 'video_call',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      alert('Consultation request sent! You will be notified once a telecaller assigns your consultation.');
      fetchMyConsultations();
    } catch (error) {
      console.error('Error booking consultation:', error);
      alert('Error booking consultation. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'prescription': return '💊';
      case 'lab_report': return '🧪';
      case 'x_ray': return '🩻';
      case 'mri': return '🧠';
      default: return '📄';
    }
  };

  const filteredDoctors = nearbyDoctors.filter(doctor => {
    const locationField = (doctor.clinic_name || doctor.clinic_address || '').toLowerCase();
    return (
      (!searchFilters.specialization || (doctor.specialization || '').toLowerCase().includes(searchFilters.specialization.toLowerCase())) &&
      (!searchFilters.location || locationField.includes(searchFilters.location.toLowerCase())) &&
      (!searchFilters.priceRange ||
        (searchFilters.priceRange === 'low' && doctor.consultation_fee < 400) ||
        (searchFilters.priceRange === 'medium' && doctor.consultation_fee >= 400 && doctor.consultation_fee < 600) ||
        (searchFilters.priceRange === 'high' && doctor.consultation_fee >= 600)
      )
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your health dashboard...</p>
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
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">🏥</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">AidocCall Patient Portal</h1>
                <p className="text-sm text-gray-500">Your Health, Our Priority</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-gray-800">{userProfile?.full_name}</p>
                <p className="text-sm text-gray-500">Patient ID: PT{user?.id?.substr(-6)}</p>
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

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <div className="flex space-x-8">
            {[
              { id: 'discover', label: 'Discover Doctors', icon: '🔍' },
              { id: 'consultations', label: 'My Consultations', icon: '📅' },
              { id: 'documents', label: 'Medical Records', icon: '📋' },
              { id: 'profile', label: 'My Profile', icon: '👤' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Emergency Button */}
        <div className="mb-6">
          <button 
            onClick={() => navigate('/')}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition shadow-lg"
          >
            🚨 Emergency Consultation
          </button>
        </div>

        {/* Discover Doctors Tab */}
        {activeTab === 'discover' && (
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Find Doctors Near You</h2>
              
              {/* Search Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                  <select
                    value={searchFilters.specialization}
                    onChange={(e) => setSearchFilters({...searchFilters, specialization: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Specializations</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="pediatrics">Pediatrics</option>
                    <option value="general">General Medicine</option>
                    <option value="dermatology">Dermatology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="Hospital or area"
                    value={searchFilters.location}
                    onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <select
                    value={searchFilters.priceRange}
                    onChange={(e) => setSearchFilters({...searchFilters, priceRange: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Price</option>
                    <option value="low">Under ₹400</option>
                    <option value="medium">₹400 - ₹600</option>
                    <option value="high">Above ₹600</option>
                  </select>
                </div>
              </div>

              {/* Doctor Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors.map((doctor) => (
                  <div key={doctor.id} className="border rounded-xl p-6 hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">Dr</span>
                      </div>
                      {doctor.is_verified && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Verified
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-800 text-lg mb-1">{doctor.full_name}</h3>
                    <p className="text-blue-600 font-medium text-sm mb-1">{doctor.specialization}</p>
                    <p className="text-gray-600 text-sm mb-3">{doctor.clinic_name || doctor.clinic_address || 'Available for consultation'}</p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <span className="material-icons text-blue-500 text-sm">work_history</span>
                        <span className="font-medium">{doctor.experience_years || 0} yrs exp</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{doctor.consultation_fee || doctor.online_fee || 0}</p>
                        <p className="text-xs text-gray-500">per consultation</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBookConsultation(doctor.id)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      Book Consultation
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* My Consultations Tab */}
        {activeTab === 'consultations' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">My Consultations</h2>
            
            <div className="space-y-4">
              {myConsultations.map((consultation) => (
                <div key={consultation.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{consultation.consultation_id}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                        {consultation.status.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(consultation.appointment_time).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {consultation.doctor?.full_name}
                      </h3>
                      <p className="text-sm text-gray-600">{consultation.doctor?.specialization}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">₹{consultation.total_amount}</p>
                      {consultation.doctor_notes && (
                        <p className="text-sm text-gray-600 mt-1">{consultation.doctor_notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medical Documents Tab */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Medical Records</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                Upload Document
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myDocuments.map((document) => (
                <div key={document.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{getDocumentIcon(document.document_type)}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 truncate">{document.file_name}</h3>
                      <p className="text-sm text-gray-600">{document.description}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    {new Date(document.uploaded_date).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <button className="flex-1 border border-gray-300 text-gray-700 py-1 px-3 rounded text-sm hover:bg-gray-100">
                      View
                    </button>
                    <button className="flex-1 border border-gray-300 text-gray-700 py-1 px-3 rounded text-sm hover:bg-gray-100">
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">My Profile</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={userProfile?.full_name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={userProfile?.email || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={userProfile?.phone || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={userProfile?.date_of_birth || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
              Update Profile
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>v1.2 - 2026-01-17</p>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;