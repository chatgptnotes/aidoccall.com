import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';

const Driver = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [driverData, setDriverData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDriverData(data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;

    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh the list
      fetchDrivers();
      alert('Driver deleted successfully!');
    } catch (error) {
      console.error('Error deleting driver:', error);
      alert('Failed to delete driver: ' + error.message);
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 ml-64">
        {/* Top Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Driver Management</h1>
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

        {/* Main Content */}
        <main className="p-8">
          <div className="bg-white rounded-2xl shadow-md p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Driver Data</h2>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Search by First Name or ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                />
                <button
                  onClick={() => navigate('/dashboard/driver/create')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Create Driver
                </button>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin text-6xl mb-4">🚗</div>
                  <p className="text-gray-600">Loading drivers...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600 font-semibold">Error loading drivers</p>
                <p className="text-red-500 text-sm mt-2">{error}</p>
                <button
                  onClick={fetchDrivers}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            ) : driverData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No drivers found</p>
                <button
                  onClick={() => navigate('/dashboard/driver/create')}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create First Driver
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Id</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Full Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Address</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vehicle</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driverData.map((driver) => (
                      <tr key={driver.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-4 py-4 text-gray-600">{driver.id}</td>
                        <td className="px-4 py-4 text-gray-800 font-medium">
                          {driver.first_name} {driver.last_name}
                        </td>
                        <td className="px-4 py-4 text-gray-600 text-sm">{driver.email}</td>
                        <td className="px-4 py-4 text-gray-600">{driver.phone}</td>
                        <td className="px-4 py-4 text-gray-600">{driver.address || '-'}</td>
                        <td className="px-4 py-4 text-gray-600 text-sm">
                          {driver.vehicle_model} ({driver.vehicle_number})
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button className="bg-green-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-green-600 transition font-semibold">
                              View
                            </button>
                            <button className="bg-orange-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-orange-600 transition font-semibold">
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(driver.id)}
                              className="bg-red-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-600 transition font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 transition">
                &lt;
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 transition">
                2
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 transition">
                &gt;
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Driver;
