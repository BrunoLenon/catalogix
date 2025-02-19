/*
  # Implement admin-controlled user management

  1. Changes
    - Add username column to profiles
    - Add active status column to profiles
    - Add user permissions table
    - Update RLS policies for admin control

  2. Security
    - Only admins can create new users
    - Admins can manage user permissions
    - Users can only access allowed features
*/

-- Add new columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login timestamptz;

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text
);

-- Create user_permissions junction table
CREATE TABLE IF NOT EXISTS user_permissions (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES profiles(id),
  granted_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, permission_id)
);

-- Enable RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
  ('view_products', 'Can view product catalog'),
  ('manage_cart', 'Can manage shopping cart'),
  ('view_orders', 'Can view order history'),
  ('manage_products', 'Can manage products'),
  ('manage_categories', 'Can manage categories'),
  ('manage_users', 'Can manage users'),
  ('view_analytics', 'Can view analytics')
ON CONFLICT (name) DO NOTHING;

-- RLS Policies for permissions
CREATE POLICY "Anyone can view permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify permissions"
  ON permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for user_permissions
CREATE POLICY "Users can view their own permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can modify user permissions"
  ON user_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(user_id uuid, permission_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles p
    LEFT JOIN user_permissions up ON up.user_id = p.id
    LEFT JOIN permissions perm ON perm.id = up.permission_id
    WHERE p.id = user_id
    AND (p.role = 'admin' OR perm.name = permission_name)
    AND p.active = true
  );
END;
$$;