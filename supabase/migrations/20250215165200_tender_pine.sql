-- Update RLS policies for better admin access
DROP POLICY IF EXISTS "Public profiles access" ON profiles;
DROP POLICY IF EXISTS "Admin profiles management" ON profiles;
DROP POLICY IF EXISTS "Self profile management" ON profiles;

-- Create new policies with proper admin access
CREATE POLICY "Admins can do everything"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND active = true
    )
  );

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND active = true
    )
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Add function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND role = 'admin'
    AND active = true
  );
END;
$$;

-- Add function to safely create users
CREATE OR REPLACE FUNCTION create_user(
  p_username text,
  p_full_name text,
  p_role text DEFAULT 'customer'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if calling user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can create users';
  END IF;

  -- Generate new user ID
  v_user_id := gen_random_uuid();
  
  -- Create profile
  INSERT INTO profiles (
    id,
    username,
    full_name,
    role,
    active
  ) VALUES (
    v_user_id,
    p_username,
    p_full_name,
    p_role,
    true
  );
  
  RETURN v_user_id;
END;
$$;