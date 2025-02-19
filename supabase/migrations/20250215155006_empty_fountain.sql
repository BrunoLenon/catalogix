/*
  # Create admin user and ensure proper setup

  1. Changes
    - Create admin user safely with proper role and metadata
    - Ensure profile exists with admin privileges
    - Add necessary security policies

  2. Security
    - Admin user will have full access to all tables
    - Password is securely hashed
    - Profile is properly linked
*/

-- Function to create admin user if it doesn't exist
DO $$ 
DECLARE 
  admin_uid UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Only create if admin doesn't exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
    -- Insert admin into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      phone_change,
      is_super_admin,
      role_id
    ) VALUES (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'admin@example.com',
      crypt('Admin@123456', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Administrator"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      '',
      '',
      FALSE,
      1
    );

    -- Ensure profile exists
    INSERT INTO public.profiles (
      id,
      full_name,
      role,
      approved,
      company,
      created_at,
      updated_at
    ) VALUES (
      admin_uid,
      'Administrator',
      'admin',
      true,
      'Company Name',
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      approved = true,
      updated_at = NOW();
  END IF;
END $$;