-- Create explorations table to store user exploration data
CREATE TABLE public.explorations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'student',
  query TEXT NOT NULL,
  answer TEXT NOT NULL,
  concepts TEXT[] DEFAULT '{}',
  refs JSONB DEFAULT '[]',
  explanation_mode TEXT,
  rubric_scores JSONB,
  depth_level INTEGER NOT NULL DEFAULT 0,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.explorations ENABLE ROW LEVEL SECURITY;

-- Users can only view their own explorations
CREATE POLICY "Users can view own explorations"
  ON public.explorations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own explorations
CREATE POLICY "Users can insert own explorations"
  ON public.explorations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own explorations
CREATE POLICY "Users can delete own explorations"
  ON public.explorations FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast user lookups
CREATE INDEX idx_explorations_user_id ON public.explorations(user_id);
CREATE INDEX idx_explorations_session ON public.explorations(session_id);