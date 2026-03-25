-- Upgrade IDs to BIGINT to support large timestamp-based values
ALTER TABLE users ALTER COLUMN id TYPE BIGINT;
-- Resetting SERIAL requires sequence update if needed, but BIGSERIAL/SERIAL is just an abstraction.
-- In PostgreSQL, just changing TYPE is enough.

ALTER TABLE rooms ALTER COLUMN id TYPE BIGINT;
ALTER TABLE rooms ALTER COLUMN created_by TYPE BIGINT;

ALTER TABLE room_members ALTER COLUMN room_id TYPE BIGINT;
ALTER TABLE room_members ALTER COLUMN user_id TYPE BIGINT;

ALTER TABLE messages ALTER COLUMN id TYPE BIGINT;
ALTER TABLE messages ALTER COLUMN room_id TYPE BIGINT;
ALTER TABLE messages ALTER COLUMN author_id TYPE BIGINT;

-- Note: BIGSERIAL is just BIGINT with a sequence. The sequence already exists for SERIAL. 
-- This script ensures column types are large enough.
