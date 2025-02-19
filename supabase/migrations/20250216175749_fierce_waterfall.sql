/*
  # Fix admin user and authentication

  1. Changes
    - Create new admin user
    - Set proper role in app_metadata
    - Update profile handling

  2. Security
    - Maintain proper access control
    - Use secure password hashing
    - Set proper role claims
*/

-- Function to create admin user if it doesn't exist
DO $$ 
DECLARE 
  admin_uid UUID;
BEGIN
  -- Generate new UUID for admin
  admin_uid := gen_random_uuid();

  -- Only create if admin doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'admin@example.com'
  ) THEN
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
      role_id,
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'admin@example.com',
      crypt('Admin@123456', gen_salt('bf')),
      NOW(),
      jsonb_build_object(
        'role', 'admin',
        'provider', 'email',
        'providers', ARRAY['email']
      ),
      jsonb_build_object(
        'full_name', 'Administrator'
      ),
      NOW(),
      NOW(),
      1,
      'authenticated',
      '',
      '',
      '',
      ''
    );

    -- Create admin profile
    INSERT INTO public.profiles (
      id,
      username,
      full_name,
      role,
      active
    ) VALUES (
      admin_uid,
      'admin@example.com',
      'Administrator',
      'admin',
      true
    );
  END IF;
END $$;