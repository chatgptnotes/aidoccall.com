import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uakqdjxuceckjssjdyui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVha3Fkanh1Y2Vja2pzc2pkeXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA3MDM1MywiZXhwIjoyMDgyNjQ2MzUzfQ.Kc3pV1OSDrKxPwXZeOtR3HFrO7Kpia3mAmfI8XWOpJA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsersTable() {
  try {
    console.log('Checking users table...');
    
    // Check if table exists and get schema
    const { data: tableInfo, error: schemaError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('Error accessing users table:', schemaError);
      return;
    }
    
    // Count total rows
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting rows:', countError);
      return;
    }
    
    console.log(`Total users in table: ${count}`);
    
    // Get all users data
    const { data: users, error: dataError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (dataError) {
      console.error('Error fetching users:', dataError);
      return;
    }
    
    console.log('Users data:', JSON.stringify(users, null, 2));
    
    // Check auth.users table as well
    console.log('\nChecking auth.users table...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
    } else {
      console.log(`Total auth users: ${authUsers.users.length}`);
      authUsers.users.forEach(user => {
        console.log(`Auth user: ${user.email} (id: ${user.id})`);
      });
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkUsersTable();