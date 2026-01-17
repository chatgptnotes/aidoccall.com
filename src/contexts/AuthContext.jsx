import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getAdminClient } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Fetch user profile and role from database with minimal retry logic
  const fetchUserProfile = async (userId, retryCount = 0) => {
    const maxRetries = 1; // Reduced from 3 to prevent long waits
    setRoleLoading(true);

    try {
      let data, error;

      // Try with admin client first for better permissions
      try {
        const adminClient = getAdminClient();
        const result = await adminClient
          .from('users')
          .select('*')
          .eq('auth_user_id', userId)
          .single();
        data = result.data;
        error = result.error;

        if (!data && !error) {
          // Try with id field if auth_user_id doesn't work
          const idResult = await adminClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
          data = idResult.data;
          error = idResult.error;
        }
      } catch (adminError) {
        console.log('Admin client failed, trying regular client:', adminError.message);

        // Fallback to regular client
        const result = await supabase
          .from('users')
          .select('*')
          .or(`auth_user_id.eq.${userId},id.eq.${userId}`)
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        if (error.code === '42P17') {
          console.log('RLS policy issue detected. Using email-based lookup...');

          // Try to get user by email from auth
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) {
            try {
              const emailResult = await supabase
                .from('users')
                .select('*')
                .eq('email', user.email)
                .single();
              data = emailResult.data;
              error = emailResult.error;
            } catch (emailError) {
              console.log('Email lookup also failed:', emailError);
            }
          }
        }

        if (error && error.code !== 'PGRST116') {
          throw error;
        }
      }

      if (data) {
        // Successfully found user profile - use the actual role from database
        const actualRole = data.role || 'patient';
        setUserRole(actualRole);
        setUserProfile(data);
        console.log('User profile loaded:', data.email, 'Role:', actualRole);
        setRoleLoading(false);
        return { success: true, role: actualRole };
      } else {
        // No profile found - retry once before defaulting
        if (retryCount < maxRetries) {
          console.log(`No profile found, retrying... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 200)); // Reduced delay
          return fetchUserProfile(userId, retryCount + 1);
        }

        // After retries, default to patient (new user)
        console.log('No user profile found after retries, defaulting to patient role');
        setUserRole('patient');
        setUserProfile({ id: userId, role: 'patient' });
        setRoleLoading(false);
        return { success: false, role: 'patient' };
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);

      // Retry on error
      if (retryCount < maxRetries) {
        console.log(`Error occurred, retrying... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 200)); // Reduced delay
        return fetchUserProfile(userId, retryCount + 1);
      }

      // After retries, default to patient
      setUserRole('patient');
      setUserProfile({ id: userId, role: 'patient' });
      setRoleLoading(false);
      return { success: false, role: 'patient' };
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setRoleLoading(true);
        // Don't await - let profile fetch happen in background so login resolves immediately
        fetchUserProfile(session.user.id);
      } else {
        setUserRole(null);
        setUserProfile(null);
        setRoleLoading(false);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setRoleLoading(true);
        // Don't await - let profile fetch happen in background so signInWithPassword resolves immediately
        fetchUserProfile(session.user.id);
      } else {
        setUserRole(null);
        setUserProfile(null);
        setRoleLoading(false);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    
    if (error) throw error;

    // If user was created successfully, add them to the users table
    if (data.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: email,
          full_name: metadata.name || '',
          role: metadata.role || 'patient',
          phone: metadata.phone || '',
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error inserting user data:', insertError);
        // Don't throw here as the auth user was created successfully
      }
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    roleLoading,
    userRole,
    userProfile,
    signIn,
    signUp,
    signOut,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
