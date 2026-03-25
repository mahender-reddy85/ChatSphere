-- Remove legacy 'code' column if it exists to prevent NOT NULL violations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='code') THEN
    ALTER TABLE rooms DROP COLUMN code;
  END IF;
END
$$;
