-- Meeting Facilitator App - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Status enum types
CREATE TYPE meeting_status AS ENUM ('draft', 'active', 'completed');
CREATE TYPE question_status AS ENUM ('pending', 'active', 'revealed');

-- Meetings table
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  facilitator_code VARCHAR(6) UNIQUE NOT NULL,
  participant_code VARCHAR(6) UNIQUE NOT NULL,
  status meeting_status DEFAULT 'draft',
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
  status question_status DEFAULT 'pending',
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
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meeting_id, name)
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

-- RPC function for atomic meeting creation with questions
CREATE OR REPLACE FUNCTION create_meeting_with_questions(
  p_title VARCHAR(255),
  p_facilitator_code VARCHAR(6),
  p_participant_code VARCHAR(6),
  p_show_participant_names BOOLEAN,
  p_questions JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_meeting_id UUID;
  v_question JSONB;
  v_index INTEGER := 0;
BEGIN
  -- Create the meeting
  INSERT INTO meetings (title, facilitator_code, participant_code, show_participant_names, status)
  VALUES (p_title, p_facilitator_code, p_participant_code, p_show_participant_names, 'draft')
  RETURNING id INTO v_meeting_id;

  -- Create questions if provided
  FOR v_question IN SELECT * FROM jsonb_array_elements(p_questions)
  LOOP
    INSERT INTO questions (meeting_id, text, order_index, allow_multiple_answers, time_limit_seconds, status)
    VALUES (
      v_meeting_id,
      v_question->>'text',
      v_index,
      COALESCE((v_question->>'allowMultipleAnswers')::BOOLEAN, false),
      (v_question->>'timeLimitSeconds')::INTEGER,
      'pending'
    );
    v_index := v_index + 1;
  END LOOP;

  -- Return the created meeting
  RETURN jsonb_build_object(
    'id', v_meeting_id,
    'title', p_title,
    'facilitatorCode', p_facilitator_code,
    'participantCode', p_participant_code,
    'showParticipantNames', p_show_participant_names
  );
END;
$$;
