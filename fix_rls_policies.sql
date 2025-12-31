-- Fix Row Level Security Policies for Users Table
-- This removes the circular reference causing infinite recursion

-- First, drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Telecallers can view patient data" ON public.users;
DROP POLICY IF EXISTS "Supervisors can view telecaller data" ON public.users;

-- Disable RLS temporarily to avoid issues
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- 1. Users can view their own profile
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 2. Users can update their own profile  
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 3. Allow admin users to view all users (using raw auth.jwt() check to avoid recursion)
CREATE POLICY "admin_select_all" ON public.users
  FOR SELECT USING (
    (auth.jwt() ->> 'email') IN (
      'admin@aidoccall.com', 
      'admin@raftaar.com',
      'admin@gmail.com'
    )
  );

-- 4. Allow admin users to insert new users
CREATE POLICY "admin_insert_all" ON public.users
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'email') IN (
      'admin@aidoccall.com', 
      'admin@raftaar.com',
      'admin@gmail.com'
    )
  );

-- 5. Allow admin users to update all users
CREATE POLICY "admin_update_all" ON public.users
  FOR UPDATE USING (
    (auth.jwt() ->> 'email') IN (
      'admin@aidoccall.com', 
      'admin@raftaar.com',
      'admin@gmail.com'
    )
  );

-- 6. Allow admin users to delete users
CREATE POLICY "admin_delete_all" ON public.users
  FOR DELETE USING (
    (auth.jwt() ->> 'email') IN (
      'admin@aidoccall.com', 
      'admin@raftaar.com',
      'admin@gmail.com'
    )
  );

-- Alternative: If you want to completely disable RLS for development/testing
-- Uncomment the line below (but this removes all security!)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

COMMIT;