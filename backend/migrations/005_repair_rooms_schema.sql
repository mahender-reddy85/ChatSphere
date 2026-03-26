-- 🛠️ Database Schema Repair & Optimization

-- 1. Ensure 'visibility' matches the backend implementation (Renaming from legacy 'privacy')
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='privacy') THEN
    ALTER TABLE rooms RENAME COLUMN privacy TO visibility;
  END IF;
END
$$;

-- 2. Ensure 'code' column is present for unique indexing (REQUIRED by nanoid logic)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='code') THEN
    ALTER TABLE rooms ADD COLUMN code VARCHAR(255);
    
    -- Populate existing rooms with unique dummy codes for bootstrap
    UPDATE rooms SET code = 'room-' || id WHERE code IS NULL;
    
    ALTER TABLE rooms ALTER COLUMN code SET NOT NULL;
    ALTER TABLE rooms ADD CONSTRAINT unique_room_code UNIQUE (code);
  ELSE
    -- If column exists but has some nulls
    UPDATE rooms SET code = 'room-' || id WHERE code IS NULL;
    ALTER TABLE rooms ALTER COLUMN code SET NOT NULL;
  END IF;
END
$$;

-- 3. Ensure room names are indexed for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_name ON rooms(name);

-- 4. Ensure 'last_seen' column is present in 'users' table for presence tracking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_seen') THEN
    ALTER TABLE users ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  END IF;
END
$$;

-- 5. Ensure last_seen index for presence tracking scalability
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
