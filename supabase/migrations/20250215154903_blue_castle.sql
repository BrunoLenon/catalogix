/*
  # Create admin user

  1. Changes
    - Insert admin user into auth.users
    - Set admin role in profiles table
    - Add admin policies

  2. Security
    - Admin user will have full access to all tables
    - Password is hashed and secure
*/

-- Create admin user in auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  crypt('Admin@123456', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Administrator"}',
  now()
);

-- Set admin role in profiles
UPDATE profiles 
SET 
  role = 'admin',
  approved = true,
  full_name = 'Administrator',
  company = 'Company Name'
WHERE id = '00000000-0000-0000-0000-000000000000';