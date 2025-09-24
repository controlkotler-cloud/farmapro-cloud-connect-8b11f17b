import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client for admin operations (service role)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Client for checking current user permissions (with user token)
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Verify current user is admin
    const { data: isAdmin, error: adminError } = await supabaseUser.rpc('is_current_user_admin');
    
    if (adminError) {
      console.error('Error checking admin status:', adminError);
      throw new Error('Failed to verify admin permissions');
    }

    if (!isAdmin) {
      throw new Error('Insufficient permissions: Only admins can create admin users');
    }

    const { email, password, fullName } = await req.json();
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    console.log('Creating admin user:', email);

    // Create the user with service role client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName || 'Admin User'
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user returned');
    }

    console.log('User created successfully:', authData.user.id);

    // Update the user's profile to admin role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_role: 'admin',
        subscription_status: 'active'
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Don't throw here, user is created but needs manual role assignment
      console.log('Warning: User created but profile update failed. Manual role assignment may be needed.');
    }

    // Add to admin_users table for extra security
    const { error: adminUserError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        user_id: authData.user.id,
        email: email,
        role: 'admin'
      });

    if (adminUserError) {
      console.error('Admin users table error:', adminUserError);
      // Don't throw, this is secondary
    }

    console.log('Admin user provisioned successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin user created successfully',
        user_id: authData.user.id,
        email: email
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in provision-admin-user function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});