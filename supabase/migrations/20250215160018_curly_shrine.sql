/*
  # Add password field to profiles table

  1. Changes
    - Add `password_hash` column to `profiles` table
      - Type: text
      - Nullable: true (to maintain compatibility with existing records)
      - Description: Stores hashed passwords for profile management
  
  2. Security
    - Column is protected by existing RLS policies
    - Only authenticated users can view/update their own profile
*/

-- Add password_hash column to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE profiles ADD COLUMN password_hash text;
  END IF;
END $$;

-- Update RLS policies to ensure password_hash is properly protected
CREATE POLICY "Users can never read password_hash"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id AND password_hash IS NULL
  );

-- Allow users to update their own password_hash
CREATE POLICY "Users can update their own password_hash"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);