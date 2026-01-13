-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'group',
    privacy VARCHAR(50) NOT NULL DEFAULT 'public',
    password TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create room_members table
CREATE TABLE IF NOT EXISTS room_members (
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    text TEXT,
    type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (create only if the column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='room_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='author_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='room_members' AND column_name='room_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='room_members' AND column_name='user_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id)';
  END IF;
END
$$;
