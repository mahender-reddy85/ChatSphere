-- 1. Ensure 'name' column is present in 'users' table (Repairing potentially incomplete schema)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='name') THEN
    ALTER TABLE users ADD COLUMN name VARCHAR(255);
    UPDATE users SET name = username WHERE name IS NULL;
  END IF;
END
$$;

-- 2. Ensure 'last_seen' column is present in 'users' table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_seen') THEN
    ALTER TABLE users ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  END IF;
END
$$;

-- 2. Ensure index for performance
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
