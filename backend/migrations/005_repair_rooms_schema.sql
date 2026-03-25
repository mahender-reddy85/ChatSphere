-- 🛠️ Database Schema Repair & Optimization

-- 1. Remove legacy 'code' NOT NULL column if it still exists (Step into modern slug-based routing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='code') THEN
    ALTER TABLE rooms DROP COLUMN code;
  END IF;
END
$$;

-- 2. Ensure room names (slugs) are indexed for fast lookups in "Join Chat" flow
CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_name ON rooms(name);

-- 3. Ensure last_seen index for presence tracking scalability
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
