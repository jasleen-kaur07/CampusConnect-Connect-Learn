-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Events policies
CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);
CREATE POLICY "Faculty can create events" ON events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'faculty')
);
CREATE POLICY "Event creators can update their events" ON events FOR UPDATE USING (created_by = auth.uid());

-- Event registrations policies
CREATE POLICY "Users can view event registrations" ON event_registrations FOR SELECT USING (true);
CREATE POLICY "Students can register for events" ON event_registrations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student') AND
    user_id = auth.uid()
);
CREATE POLICY "Users can cancel their registrations" ON event_registrations FOR DELETE USING (user_id = auth.uid());

-- Study groups policies
CREATE POLICY "Anyone can view study groups" ON study_groups FOR SELECT USING (true);
CREATE POLICY "Students can create study groups" ON study_groups FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student') AND
    created_by = auth.uid()
);
CREATE POLICY "Group creators can update their groups" ON study_groups FOR UPDATE USING (created_by = auth.uid());

-- Study group members policies
CREATE POLICY "Anyone can view study group members" ON study_group_members FOR SELECT USING (true);
CREATE POLICY "Students can join study groups" ON study_group_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can leave study groups" ON study_group_members FOR DELETE USING (user_id = auth.uid());

-- Collaborations policies
CREATE POLICY "Anyone can view collaborations" ON collaborations FOR SELECT USING (true);
CREATE POLICY "Students can create collaboration requests" ON collaborations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student') AND
    requester_id = auth.uid()
);
CREATE POLICY "Requesters and mentors can update collaborations" ON collaborations FOR UPDATE USING (
    requester_id = auth.uid() OR mentor_id = auth.uid()
);

-- Chat rooms policies
CREATE POLICY "Users can view their chat rooms" ON chat_rooms FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_participants WHERE room_id = id AND user_id = auth.uid())
);
CREATE POLICY "Users can create chat rooms" ON chat_rooms FOR INSERT WITH CHECK (created_by = auth.uid());

-- Chat participants policies
CREATE POLICY "Users can view chat participants" ON chat_participants FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_participants cp WHERE cp.room_id = room_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Room creators can add participants" ON chat_participants FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND created_by = auth.uid())
);

-- Messages policies
CREATE POLICY "Users can view messages in their rooms" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_participants WHERE room_id = messages.room_id AND user_id = auth.uid())
);
CREATE POLICY "Users can send messages to their rooms" ON messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chat_participants WHERE room_id = messages.room_id AND user_id = auth.uid()) AND
    sender_id = auth.uid()
);

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
