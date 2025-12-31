import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uakqdjxuceckjssjdyui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVha3Fkanh1Y2Vja2pzc2pkeXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA3MDM1MywiZXhwIjoyMDgyNjQ2MzUzfQ.Kc3pV1OSDrKxPwXZeOtR3HFrO7Kpia3mAmfI8XWOpJA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTelecallerDirect() {
  try {
    console.log('Creating telecaller without email confirmation...');
    
    const userData = {
      email: 'telecaller123@aidoccall.com',
      password: 'password123',
      full_name: 'Test Telecaller',
      phone: '09172740454',
      employee_id: 'TC123'
    };
    
    // Step 1: Create auth user with admin API (no email confirmation required)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'telecaller',
        full_name: userData.full_name
      }
    });
    
    if (authError) {
      console.error('Auth creation error:', authError);
      throw authError;
    }
    
    console.log('✅ Auth user created:', authUser.user.email);
    
    // Step 2: Create database record
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authUser.user.id,
        id: crypto.randomUUID(),
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone,
        employee_id: userData.employee_id,
        role: 'telecaller',
        password: userData.password,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Database creation error:', dbError);
      throw dbError;
    }
    
    console.log('✅ Database user created:', dbUser.email);
    console.log('✅ Telecaller ready to login with:');
    console.log('   Email:', userData.email);
    console.log('   Password:', userData.password);
    
    return { success: true, user: dbUser };
    
  } catch (error) {
    console.error('Error creating telecaller:', error);
    return { success: false, error: error.message };
  }
}

createTelecallerDirect();