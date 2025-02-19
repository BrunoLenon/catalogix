-- Update RLS policies to fix permission issues
DROP POLICY IF EXISTS "Public profiles access" ON profiles;
DROP POLICY IF EXISTS "Admin profiles management" ON profiles;
DROP POLICY IF EXISTS "Self profile management" ON profiles;

-- Create new policies with proper checks
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

CREATE POLICY "Users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Users can see their own profile
    id = auth.uid()
    OR
    -- Admins can see all profiles
    EXISTS (
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

-- Add service role function for admin operations
CREATE OR REPLACE FUNCTION admin_create_user(
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
  -- Verify the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND active = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Create the user
  v_user_id := gen_random_uuid();
  
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