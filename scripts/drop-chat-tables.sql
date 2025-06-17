-- Drop chat-related tables in the correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chat_participants;
DROP TABLE IF EXISTS chat_rooms;
DROP TABLE IF EXISTS private_messages;
DROP TABLE IF EXISTS connection_requests;

-- Remove the is_online and last_seen columns from profiles table
ALTER TABLE profiles
DROP COLUMN IF EXISTS is_online,
DROP COLUMN IF EXISTS last_seen; 