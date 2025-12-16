-- Supabase Authentication Migration
-- Run this SQL in your Supabase SQL Editor

-- 1. Add created_by column to meetings table (references auth.users)
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 2. Create index for faster queries by creator
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON meetings(created_by);

-- 3. Update the create_meeting_with_questions function to accept created_by parameter
CREATE OR REPLACE FUNCTION create_meeting_with_questions(
  p_title TEXT,
  p_facilitator_code TEXT,
  p_participant_code TEXT,
  p_show_participant_names BOOLEAN DEFAULT TRUE,
  p_questions JSONB DEFAULT '[]'::JSONB,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_meeting_id UUID;
  v_question JSONB;
  v_order_index INT := 0;
  v_questions_result JSONB := '[]'::JSONB;
  v_question_record RECORD;
BEGIN
  -- Create meeting
  INSERT INTO meetings (title, facilitator_code, participant_code, show_participant_names, created_by)
  VALUES (p_title, p_facilitator_code, p_participant_code, p_show_participant_names, p_created_by)
  RETURNING id INTO v_meeting_id;

  -- Create questions
  FOR v_question IN SELECT * FROM jsonb_array_elements(p_questions)
  LOOP
    INSERT INTO questions (
      meeting_id,
      text,
      order_index,
      allow_multiple_answers,
      time_limit_seconds
    ) VALUES (
      v_meeting_id,
      v_question->>'text',
      v_order_index,
      COALESCE((v_question->>'allowMultipleAnswers')::BOOLEAN, FALSE),
      (v_question->>'timeLimitSeconds')::INT
    )
    RETURNING * INTO v_question_record;

    v_questions_result := v_questions_result || jsonb_build_object(
      'id', v_question_record.id,
      'meetingId', v_question_record.meeting_id,
      'text', v_question_record.text,
      'orderIndex', v_question_record.order_index,
      'allowMultipleAnswers', v_question_record.allow_multiple_answers,
      'timeLimitSeconds', v_question_record.time_limit_seconds,
      'status', v_question_record.status,
      'createdAt', v_question_record.created_at
    );

    v_order_index := v_order_index + 1;
  END LOOP;

  -- Return meeting with questions
  RETURN jsonb_build_object(
    'id', v_meeting_id,
    'title', p_title,
    'facilitatorCode', p_facilitator_code,
    'participantCode', p_participant_code,
    'showParticipantNames', p_show_participant_names,
    'status', 'draft',
    'currentQuestionIndex', 0,
    'createdBy', p_created_by,
    'questions', v_questions_result
  );
END;
$$;

-- 4. Optional: Add user_id to participants table for linking logged-in participants
-- Uncomment if you want to track which participants are logged in
-- ALTER TABLE participants ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
-- CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
