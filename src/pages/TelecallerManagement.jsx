import React, { useState, useEffect } from 'react';
import { supabase, getAdminClient } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';

const TelecallerManagement = () => {
  const [telecallers, setTelecallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTelecaller, setEditingTelecaller] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    employee_id: '',
    password: '',
    shift_timing: '',
    specialization_focus: ''
  });

  useEffect(() => {
    fetchTelecallers();
  }, []);

  const fetchTelecallers = async () => {
    try {
      // Try with admin client first, fallback to regular client
      let data, error;
      
      try {
        const adminClient = getAdminClient();
        const result = await adminClient
          .from('users')
          .select('*')
          .eq('role', 'telecaller')
          .order('created_at', { ascending: false });
        data = result.data;
        error = result.error;
      } catch (adminError) {
        console.log('Admin client failed, using regular client:', adminError.message);
        // Fallback to regular client
        const result = await supabase
          .from('users')
          .select('*')
          .eq('role', 'telecaller')
          .order('created_at', { ascending: false });
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error fetching telecallers:', error);
        if (error.code === '42P17') {
          // RLS infinite recursion error - set empty array and show message
          setTelecallers([]);
          console.log('RLS policy issue detected. Please run the fix_rls_policies.sql script in your Supabase dashboard.');
        } else {
          throw error;
        }
      } else {
        setTelecallers(data || []);
      }
    } catch (error) {
      console.error('Error fetching telecallers:', error);
      setTelecallers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address (e.g., user@example.com)');
      setLoading(false);
      return;
    }

    try {
      if (editingTelecaller) {
        // For editing, update only the non-email fields to avoid conflicts
        const updateData = { ...formData };
        delete updateData.email; // Don't update email to avoid conflicts
        
        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editingTelecaller.id);

        if (error) throw error;
      } else {
        // Check if user with this email already exists
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('email', formData.email)
          .single();

        if (checkError && checkError.code !== 'PGRST116' && checkError.code !== '42P17') {
          // PGRST116 is "not found" error, 42P17 is RLS recursion error
          if (checkError.code === '42P17') {
            console.log('RLS policy issue detected. Proceeding without email check...');
          } else {
            throw checkError;
          }
        }

        if (existingUser) {
          // User exists, check if they're already a telecaller
          if (existingUser.role === 'telecaller') {
            alert('A telecaller with this email already exists!');
            return;
          } else {
            // User exists but with different role, update their role to telecaller
            const { error: updateError } = await supabase
              .from('users')
              .update({
                ...formData,
                role: 'telecaller'
              })
              .eq('id', existingUser.id);

            if (updateError) throw updateError;
          }
        } else {
          // User doesn't exist - try multiple approaches
          let userCreated = false;
          let authUserId = null;

          // Approach 1: Try admin API
          try {
            const adminClient = getAdminClient();
            const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
              email: formData.email,
              password: formData.password || 'TeleDefault123!',
              email_confirm: true,
              user_metadata: {
                role: 'telecaller',
                full_name: formData.full_name
              }
            });

            if (!authError && authUser?.user) {
              authUserId = authUser.user.id;
              console.log('✅ Auth user created with admin API');
            }
          } catch (adminError) {
            console.log('Admin API failed, trying regular signup:', adminError.message);
            
            // Approach 2: Try regular signup
            try {
              const { data: authUser, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password || 'TeleDefault123!',
                options: {
                  data: {
                    role: 'telecaller',
                    full_name: formData.full_name
                  }
                }
              });

              if (!authError && authUser?.user) {
                authUserId = authUser.user.id;
                console.log('✅ Auth user created with regular signup');
              }
            } catch (signupError) {
              console.log('Regular signup also failed:', signupError.message);
            }
          }

          // Create database record regardless of auth success
          try {
            const adminClient = getAdminClient();
            const { error: insertError } = await adminClient
              .from('users')
              .insert({
                auth_user_id: authUserId,
                id: authUserId || crypto.randomUUID(),
                ...formData,
                role: 'telecaller',
                created_at: new Date().toISOString()
              });

            if (insertError) {
              // Try with regular client if admin fails
              const { error: regularInsertError } = await supabase
                .from('users')
                .insert({
                  auth_user_id: authUserId,
                  id: authUserId || crypto.randomUUID(),
                  ...formData,
                  role: 'telecaller',
                  created_at: new Date().toISOString()
                });
              
              if (regularInsertError) throw regularInsertError;
            }
            
            userCreated = true;
            console.log('✅ Database record created');
          } catch (dbError) {
            console.error('Database insert failed:', dbError);
            throw dbError;
          }
        }
      }

      await fetchTelecallers();
      resetForm();
      alert('Telecaller saved successfully!');
    } catch (error) {
      console.error('Error saving telecaller:', error);
      
      let errorMessage = 'Error saving telecaller: ';
      
      if (error.code === '23505') {
        errorMessage = 'A user with this email already exists. Please use a different email address.';
      } else if (error.message && error.message.includes('Email address') && error.message.includes('invalid')) {
        errorMessage = 'Please enter a valid email address (e.g., user@aidoccall.com)';
      } else if (error.message && error.message.includes('already registered')) {
        errorMessage = 'This email is already registered. Please use a different email address.';
      } else if (error.message && error.message.includes('User not allowed')) {
        errorMessage = 'Permission denied. Contact administrator to enable user creation.';
      } else if (error.message && error.message.includes('To signup please confirm')) {
        // Email confirmation required - but we'll proceed anyway
        errorMessage = 'Telecaller created successfully! Please check email for confirmation link.';
        await fetchTelecallers();
        resetForm();
        alert(errorMessage);
        return;
      } else {
        errorMessage += (error.message || 'Unknown error occurred');
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      employee_id: '',
      password: '',
      shift_timing: '',
      specialization_focus: ''
    });
    setEditingTelecaller(null);
    setShowCreateModal(false);
  };

  const handleEdit = (telecaller) => {
    setFormData({
      full_name: telecaller.full_name || '',
      email: telecaller.email || '',
      phone: telecaller.phone || '',
      employee_id: telecaller.employee_id || '',
      password: '', // Don't show existing password for security
      shift_timing: telecaller.shift_timing || '',
      specialization_focus: telecaller.specialization_focus || ''
    });
    setEditingTelecaller(telecaller);
    setShowCreateModal(true);
  };

  const handleDelete = async (telecallerId) => {
    if (!confirm('Are you sure you want to delete this telecaller?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', telecallerId);

      if (error) throw error;
      await fetchTelecallers();
    } catch (error) {
      console.error('Error deleting telecaller:', error);
      alert('Error deleting telecaller: ' + error.message);
    }
  };

  if (loading && telecallers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
      <div className="p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Telecaller Management</h1>
              <p className="text-gray-600 mt-2">Manage telecaller accounts and performance</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
            >
              <span className="material-icons">add</span>
              Add New Telecaller
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Active Telecallers</h2>
            <p className="text-gray-600 text-sm mt-1">Total: {telecallers.length} telecallers</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Phone</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Employee ID</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Shift</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Specialization</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {telecallers.map((telecaller) => (
                  <tr key={telecaller.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {telecaller.full_name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Joined {new Date(telecaller.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{telecaller.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{telecaller.phone || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{telecaller.employee_id || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{telecaller.shift_timing || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{telecaller.specialization_focus || 'General'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(telecaller)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(telecaller.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {telecallers.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      No telecallers found. Create your first telecaller account.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingTelecaller ? 'Edit Telecaller' : 'Add New Telecaller'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={editingTelecaller}
                    placeholder="example@aidoccall.com"
                    title="Please enter a valid email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password for login"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="TC001, TC002, etc."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-blue-400"
                >
                  {loading ? 'Saving...' : 'Create Telecaller'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        <div className="fixed bottom-4 right-4 text-xs text-gray-400">
          v1.1 - {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default TelecallerManagement;