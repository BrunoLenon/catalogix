/*
  # Create admin user with proper setup

  1. Changes
    - Create admin user with all required fields
    - Ensure profile exists with admin privileges
    - Handle existing user case
    - Fix confirmed_at column issue

  2. Security
    - Admin user will have full access to all tables
    - Password is securely hashed
    - Profile is properly linked
*/

-- Function to create admin user if it doesn't exist
DO $$ 
DECLARE 
  admin_uid UUID;
  existing_user_id UUID;
BEGIN
  -- Check if admin already exists
  SELECT id INTO existing_user_id 
  FROM auth.users 
  WHERE email = 'admin@example.com';

  IF existing_user_id IS NULL THEN
    -- Generate new UUID for admin
    admin_uid := gen_random_uuid();

    -- Insert admin into auth.users with all required fields
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
      role_id,
      aud
    ) VALUES (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'admin@example.com',
      crypt('Admin@123456', gen_salt('bf')),
      NOW(),
      jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email']
      ),
      jsonb_build_object(
        'full_name', 'Administrator'
      ),
      NOW(),
      NOW(),
      '',
      '',
      '',
      '',
      '',
      FALSE,
      1,
      'authenticated'
    );

    -- Ensure profile exists with admin privileges
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
  ELSE
    -- Update existing admin user if needed
    UPDATE auth.users 
    SET 
      email_confirmed_at = NOW(),
      raw_app_meta_data = jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email']
      ),
      updated_at = NOW()
    WHERE id = existing_user_id;

    -- Update existing profile
    UPDATE public.profiles 
    SET 
      role = 'admin',
      approved = true,
      updated_at = NOW()
    WHERE id = existing_user_id;
  END IF;
END $$;