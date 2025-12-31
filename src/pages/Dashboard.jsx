import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';
import BookingTable from '../components/BookingTable';

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Navigation Bar */}
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, Admin!</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">User Name: admin</span>
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

        {/* Main Dashboard Content */}
        <main className="p-8">
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Calls"
              value="1,247"
              icon="📞"
              color="blue"
              trend="+12.5%"
            />
            <StatsCard
              title="Active Telecallers"
              value="24"
              icon="👥"
              color="teal"
              trend="+2"
            />
            <StatsCard
              title="Calls Handled Today"
              value="156"
              icon="📋"
              color="purple"
              trend="+8.2%"
            />
            <StatsCard
              title="Customer Satisfaction"
              value="4.8/5"
              icon="⭐"
              color="green"
              trend="+0.2"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Call Analytics Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">1,247</h3>
                  <p className="text-sm text-gray-500">Total Calls This Month</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-gray-600">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span className="text-gray-600">In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="text-gray-600">Missed</span>
                  </div>
                </div>
              </div>
              <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg">
                <p className="text-gray-400">Call Analytics Chart</p>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Quick Summary</h3>

              {/* Telecaller Platform Status Card */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 mb-6 text-white shadow-lg">
                <div className="flex justify-between items-start mb-8">
                  <span className="text-sm font-semibold">TELECALLER PLATFORM</span>
                  <span className="text-2xl">📞</span>
                </div>
                <div className="mb-6">
                  <div className="text-xl font-bold mb-2">
                    Call Center Management
                  </div>
                  <div className="text-blue-200 text-sm">Real-time Call Tracking System</div>
                </div>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-blue-200 text-xs mb-1">System Status</p>
                    <p className="font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      Online
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-200 text-xs mb-1">Version</p>
                    <p className="font-semibold">v1.1</p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-600">👥</span>
                    <span className="text-xs text-gray-500">Telecallers</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">24</p>
                </div>
                <div className="bg-teal-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-teal-600">✅</span>
                    <span className="text-xs text-gray-500">Calls Today</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">1,156</p>
                </div>
              </div>

              {/* Call Center Performance */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Call center efficiency</p>
                  <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full font-semibold">
                    ↑ 24.7%
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-800 mb-4">94.5%</p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => navigate('/dashboard/telecallers')}
                    className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    TELECALLERS
                  </button>
                  <button 
                    onClick={() => navigate('/dashboard/reports')}
                    className="bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition font-semibold"
                  >
                    REPORTS
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Telecaller Platform Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div
              onClick={() => navigate('/dashboard/telecallers')}
              className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-md p-6 cursor-pointer hover:shadow-xl transition transform hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Active Telecallers</h3>
                <span className="text-4xl">👥</span>
              </div>
              <p className="text-sm text-blue-100 mb-2">Manage telecaller accounts and performance</p>
              <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition mt-2">
                View Team →
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Customer Satisfaction</h3>
              <p className="text-4xl font-bold text-gray-800">4.8/5</p>
              <p className="text-sm text-green-600 mt-2">↑ 0.2 from last month</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Average Call Duration</h3>
              <p className="text-4xl font-bold text-gray-800">5.2 min</p>
              <p className="text-sm text-green-600 mt-2">↓ 15% from last month</p>
            </div>
          </div>

          {/* Booking Table */}
          <BookingTable />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
