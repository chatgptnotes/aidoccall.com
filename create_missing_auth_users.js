import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uakqdjxuceckjssjdyui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVha3Fkanh1Y2Vja2pzc2pkeXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA3MDM1MywiZXhwIjoyMDgyNjQ2MzUzfQ.Kc3pV1OSDrKxPwXZeOtR3HFrO7Kpia3mAmfI8XWOpJA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMissingAuthUsers() {
  try {
    console.log('Creating missing auth entries for users...');
    
    // Get users without auth_user_id
    const { data: usersWithoutAuth, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .is('auth_user_id', null);
    
    if (fetchError) {
      console.error('Error fetching users without auth:', fetchError);
      return;
    }
    
    console.log(`Found ${usersWithoutAuth.length} users without auth entries`);
    
    // Create auth entries for each user
    for (const user of usersWithoutAuth) {
      console.log(`\nCreating auth for: ${user.email}`);
      
      const password = user.password || 'temp123456'; // Use existing password or default
      
      try {
        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: user.full_name,
            role: user.role,
            phone: user.phone
          }
        });
        
        if (authError) {
          console.error(`Failed to create auth for ${user.email}:`, authError);
          continue;
        }
        
        console.log(`✅ Created auth user for ${user.email} (ID: ${authUser.user.id})`);
        
        // Update users table with auth_user_id
        const { error: updateError } = await supabase
          .from('users')
          .update({ auth_user_id: authUser.user.id })
          .eq('id', user.id);
        
        if (updateError) {
          console.error(`Failed to update user ${user.email}:`, updateError);
        } else {
          console.log(`✅ Updated users table for ${user.email}`);
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error processing ${user.email}:`, error);
      }
    }
    
    console.log('\n=== Summary ===');
    
    // Final verification
    const { data: finalUsers, error: finalError } = await supabase
      .from('users')
      .select('email, auth_user_id')
      .order('email');
    
    if (!finalError) {
      const withAuth = finalUsers.filter(u => u.auth_user_id).length;
      const withoutAuth = finalUsers.filter(u => !u.auth_user_id).length;
      
      console.log(`Total users: ${finalUsers.length}`);
      console.log(`With auth: ${withAuth}`);
      console.log(`Without auth: ${withoutAuth}`);
      
      if (withoutAuth > 0) {
        console.log('\nUsers still without auth:');
        finalUsers.filter(u => !u.auth_user_id).forEach(u => {
          console.log(`- ${u.email}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createMissingAuthUsers();