-- Add modern columns to rooms table if missing
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'group',
  ADD COLUMN IF NOT EXISTS privacy TEXT DEFAULT 'public';

-- Optional: ensure created_at/updated_at defaults exist (non-destructive)
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
