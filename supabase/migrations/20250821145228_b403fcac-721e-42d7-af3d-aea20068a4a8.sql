-- Create job conversations table
CREATE TABLE public.job_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open'::text CHECK (status IN ('open', 'closed')),
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_preview TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job messages table
CREATE TABLE public.job_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.job_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_conversations
CREATE POLICY "Participants can view conversations" ON public.job_conversations
  FOR SELECT USING (employer_id = auth.uid() OR applicant_id = auth.uid());

CREATE POLICY "Participants can update conversations" ON public.job_conversations
  FOR UPDATE USING (employer_id = auth.uid() OR applicant_id = auth.uid())
  WITH CHECK (employer_id = auth.uid() OR applicant_id = auth.uid());

-- RLS Policies for job_messages  
CREATE POLICY "Participants can view messages" ON public.job_messages
  FOR SELECT USING (is_conversation_participant(conversation_id));

-- Helper function to check if user is conversation participant
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.job_conversations 
    WHERE id = conv_id 
    AND (employer_id = auth.uid() OR applicant_id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create job conversation with initial message
CREATE OR REPLACE FUNCTION public.create_job_conversation(
  job_id UUID,
  applicant_id UUID,
  employer_id UUID,
  initial_message TEXT
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Check if conversation already exists
  SELECT id INTO conversation_id
  FROM public.job_conversations
  WHERE job_conversations.job_id = create_job_conversation.job_id
    AND job_conversations.applicant_id = create_job_conversation.applicant_id
    AND job_conversations.employer_id = create_job_conversation.employer_id;

  -- If conversation exists, return its ID
  IF conversation_id IS NOT NULL THEN
    RETURN conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO public.job_conversations (job_id, applicant_id, employer_id, last_message_preview)
  VALUES (job_id, applicant_id, employer_id, initial_message)
  RETURNING id INTO conversation_id;

  -- Add initial message
  INSERT INTO public.job_messages (conversation_id, sender_id, body)
  VALUES (conversation_id, applicant_id, initial_message);

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send job message
CREATE OR REPLACE FUNCTION public.send_job_message(
  conversation_id UUID,
  sender_id UUID,
  message_body TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Check if user is participant
  IF NOT is_conversation_participant(conversation_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Insert message
  INSERT INTO public.job_messages (conversation_id, sender_id, body)
  VALUES (conversation_id, sender_id, message_body);

  -- Update conversation last message info
  UPDATE public.job_conversations
  SET last_message_at = now(),
      last_message_preview = message_body,
      updated_at = now()
  WHERE id = conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread conversations count
CREATE OR REPLACE FUNCTION public.get_unread_conversations_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT jc.id)::INTEGER INTO unread_count
  FROM public.job_conversations jc
  JOIN public.job_messages jm ON jc.id = jm.conversation_id
  WHERE (jc.employer_id = user_id OR jc.applicant_id = user_id)
    AND jm.sender_id != user_id
    AND jm.read_at IS NULL;
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark conversation as read
CREATE OR REPLACE FUNCTION public.mark_conversation_as_read(
  conversation_id UUID,
  user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Check if user is participant
  IF NOT is_conversation_participant(conversation_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Mark all unread messages in this conversation as read
  UPDATE public.job_messages
  SET read_at = now()
  WHERE job_messages.conversation_id = mark_conversation_as_read.conversation_id
    AND sender_id != user_id
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX idx_job_conversations_applicant ON public.job_conversations(applicant_id);
CREATE INDEX idx_job_conversations_employer ON public.job_conversations(employer_id);
CREATE INDEX idx_job_conversations_job ON public.job_conversations(job_id);
CREATE INDEX idx_job_messages_conversation ON public.job_messages(conversation_id);
CREATE INDEX idx_job_messages_sender ON public.job_messages(sender_id);
CREATE INDEX idx_job_messages_unread ON public.job_messages(read_at) WHERE read_at IS NULL;

-- Enable realtime for conversations and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_messages;