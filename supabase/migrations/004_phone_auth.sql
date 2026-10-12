-- ============================================================
-- 004_phone_auth.sql
-- Adds phone verification tracking to the profiles table
-- and a unique index for fast phone lookups.
-- ============================================================

-- Track whether a user's phone has been verified via OTP
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;

-- Unique partial index: enforce one profile per phone (ignore NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx
  ON profiles (phone)
  WHERE phone IS NOT NULL;

-- phone_verified is set to true by the server (service role) after
-- successful OTP verification via /api/auth/create-profile.
-- RLS already prevents users from writing to this column directly.

COMMENT ON COLUMN profiles.phone_verified IS
  'Set to true by the server after the user successfully verifies their phone number via OTP.';
