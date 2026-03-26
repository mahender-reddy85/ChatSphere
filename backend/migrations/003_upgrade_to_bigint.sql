-- Upgrade IDs and Foreign Keys to BIGINT to support large timestamp-based values
-- This script is robust and uses EXECUTE to avoid parse-time errors on missing columns.

DO $$
BEGIN
    -- 1. Upgrade users.id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='id') THEN
        EXECUTE 'ALTER TABLE users ALTER COLUMN id TYPE BIGINT';
    END IF;

    -- 2. Upgrade rooms.id and rooms.created_by
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='id') THEN
        EXECUTE 'ALTER TABLE rooms ALTER COLUMN id TYPE BIGINT';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='created_by') THEN
        EXECUTE 'ALTER TABLE rooms ALTER COLUMN created_by TYPE BIGINT';
    END IF;

    -- 3. Upgrade room_members.room_id and room_members.user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='room_members' AND column_name='room_id') THEN
        EXECUTE 'ALTER TABLE room_members ALTER COLUMN room_id TYPE BIGINT';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='room_members' AND column_name='user_id') THEN
        EXECUTE 'ALTER TABLE room_members ALTER COLUMN user_id TYPE BIGINT';
    END IF;

    -- 4. Repair/Upgrade messages.id, messages.room_id, and messages.author_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='id') THEN
        EXECUTE 'ALTER TABLE messages ALTER COLUMN id TYPE BIGINT';
    END IF;

    -- 🗝️ CRITICAL FIX: Use EXECUTE to avoid parse-time errors on missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='room_id') THEN
        EXECUTE 'ALTER TABLE messages ADD COLUMN room_id BIGINT';
    ELSE
        EXECUTE 'ALTER TABLE messages ALTER COLUMN room_id TYPE BIGINT';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='author_id') THEN
        EXECUTE 'ALTER TABLE messages ALTER COLUMN author_id TYPE BIGINT';
    END IF;

END
$$;
