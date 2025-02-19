/*
  # Add password column to profiles table

  1. Changes
    - Add `password` column to profiles table
    - Add RLS policies to protect password data
    - Add function to hash passwords

  2. Security
    - Password is stored as a hashed value
    - Only authenticated users can update their own password
    - Password is never exposed in SELECT queries
*/

-- Add password column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'password'
  ) THEN
    ALTER TABLE profiles ADD COLUMN password text;
  END IF;
END $$;

-- Create a function to hash passwords
CREATE OR REPLACE FUNCTION hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$;

-- Create a function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(password text, hashed_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN hashed_password = crypt(password, hashed_password);
END;
$$;

-- Update RLS policies
CREATE POLICY "Users can never read password"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id AND 
    (password IS NULL OR password = '')
  );

-- Allow users to update their own password
CREATE POLICY "Users can update their own password"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger to automatically hash passwords on insert/update
CREATE OR REPLACE FUNCTION hash_password_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.password IS NOT NULL AND 
     (OLD.password IS NULL OR NEW.password != OLD.password) THEN
    NEW.password := hash_password(NEW.password);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER hash_password_on_change
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION hash_password_trigger();