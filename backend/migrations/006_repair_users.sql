-- 🛠️ Database Repair - Users Table
-- 1. Ensure 'last_seen' column is present in 'users' table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_seen') THEN
    ALTER TABLE users ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  END IF;
END
$$;

-- 2. Ensure index for performance
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
