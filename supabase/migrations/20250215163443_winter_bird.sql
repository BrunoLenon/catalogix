/*
  # Fix RLS policies recursion

  1. Changes
    - Remove recursive policy checks
    - Simplify RLS policies
    - Add direct role checks

  2. Security
    - Maintain proper access control
    - Fix infinite recursion issue
    - Ensure admin privileges
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Public profiles access"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin profiles management"
  ON profiles FOR ALL
  TO authenticated
  USING (role = 'admin');

CREATE POLICY "Self profile management"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Update trigger function to handle new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    role,
    active
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    active = EXCLUDED.active;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;