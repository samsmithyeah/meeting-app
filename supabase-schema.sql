-- Meeting Facilitator App - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Meetings table
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  facilitator_code VARCHAR(6) UNIQUE NOT NULL,
  participant_code VARCHAR(6) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  current_question_index INTEGER DEFAULT 0,
  show_participant_names BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  allow_multiple_answers BOOLEAN DEFAULT false,
  time_limit_seconds INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participants table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  socket_id VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answers table
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_meetings_facilitator_code ON meetings(facilitator_code);
CREATE INDEX idx_meetings_participant_code ON meetings(participant_code);
CREATE INDEX idx_questions_meeting_id ON questions(meeting_id);
CREATE INDEX idx_participants_meeting_id ON participants(meeting_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_participant_id ON answers(participant_id);

-- Enable Row Level Security (optional - for production)
-- ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
