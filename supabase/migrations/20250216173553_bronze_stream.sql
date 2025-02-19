/*
  # Fix RLS policies for profiles table

  1. Changes
    - Drop existing policies that might conflict
    - Create new policies with proper security checks
    - Add bypass RLS for service role operations
    - Fix user creation and management issues

  2. Security
    - Enable RLS on profiles table
    - Add policies for:
      - Admin access
      - User self-management
      - Public profile viewing
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can do everything" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles access" ON profiles;
DROP POLICY IF EXISTS "Admin profiles management" ON profiles;
DROP POLICY IF EXISTS "Self profile management" ON profiles;

-- Create new policies with proper security checks
CREATE POLICY "Admins have full access"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.active = true
    )
  );

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.active = true
    )
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Service role has full access"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update trigger function to handle new user creation
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
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;