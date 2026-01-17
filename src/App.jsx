import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EmergencyLocation from './pages/EmergencyLocation';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TelecallerDashboard from './pages/TelecallerDashboard';
import PatientDashboard from './pages/PatientDashboard';
import TelecallerManagement from './pages/TelecallerManagement';
import Driver from './pages/Driver';
import CreateDriver from './pages/CreateDriver';
import EditDriver from './pages/EditDriver';
import Bookings from './pages/Bookings';
import Hospital from './pages/Hospital';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

// Patient Portal Pages
import PatientRegister from './pages/patient/PatientRegister';
import PatientPortal from './pages/patient/PatientPortal';

// Role-based Dashboard Component
const RoleDashboard = () => {
  const { userRole, userProfile, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }
  
  // Get role from userRole or userProfile with debugging
  const role = userRole || userProfile?.role;
  console.log('🔍 Role Detection - userRole:', userRole, 'userProfile.role:', userProfile?.role, 'final role:', role);
  
  // Route to appropriate dashboard based on role
  if (role === 'telecaller') {
    console.log('Routing to TelecallerDashboard');
    return <TelecallerDashboard />;
  } else if (role === 'patient' || role === 'user') {
    console.log('Routing to PatientPortal');
    return <PatientPortal />;
  } else if (role === 'admin') {
    console.log('Routing to AdminDashboard');
    return <Dashboard />;
  } else {
    // If no role detected, show role selection or default to patient portal
    console.log('No role detected, defaulting to PatientPortal. userRole:', userRole, 'userProfile:', userProfile);
    return <PatientPortal />;
  }
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EmergencyLocation />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RoleDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/driver"
          element={
            <ProtectedRoute>
              <Driver />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/driver/create"
          element={
            <ProtectedRoute>
              <CreateDriver />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/driver/edit/:id"
          element={
            <ProtectedRoute>
              <EditDriver />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/bookings"
          element={
            <ProtectedRoute>
              <Bookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/hospital"
          element={
            <ProtectedRoute>
              <Hospital />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/telecallers"
          element={
            <ProtectedRoute>
              <TelecallerManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/performance"
          element={
            <ProtectedRoute>
              <TelecallerManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/call-logs"
          element={
            <ProtectedRoute>
              <TelecallerManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/schedules"
          element={
            <ProtectedRoute>
              <TelecallerManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/reports"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* Patient Portal Routes */}
        <Route path="/patient/register" element={<PatientRegister />} />
        <Route
          path="/patient/portal"
          element={
            <ProtectedRoute>
              <PatientPortal />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;