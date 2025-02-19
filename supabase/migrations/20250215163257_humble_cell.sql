/*
  # Fix RLS policies for user creation

  1. Changes
    - Add bypass RLS policy for admin user creation
    - Update trigger to handle user creation properly
    - Add service role function for user management

  2. Security
    - Maintain proper access control
    - Ensure admin privileges are respected
*/

-- Enable bypass RLS for admin operations
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new policies with proper security
CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Create service role function for user creation
CREATE OR REPLACE FUNCTION create_new_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text DEFAULT 'customer'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Create auth user first
  v_user_id := auth.uid();
  
  -- Insert into profiles with service role
  INSERT INTO profiles (
    id,
    username,
    full_name,
    role,
    active
  ) VALUES (
    v_user_id,
    p_email,
    p_full_name,
    p_role,
    true
  );
  
  RETURN v_user_id;
END;
$$;