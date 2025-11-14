-- Create reports table for Jaga Kali Pekalongan
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL DEFAULT 'general', -- plastic, waste, hazardous, other
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  address TEXT,
  image_urls TEXT[] DEFAULT '{}', -- Array of Blob URLs
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
  confirmations_count INTEGER DEFAULT 0,
  is_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view all reports
CREATE POLICY "Anyone can view reports"
  ON public.reports FOR SELECT
  USING (true);

-- Allow anyone to insert reports (anonymous submissions)
CREATE POLICY "Anyone can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (true);

-- Allow updating report confirmations
CREATE POLICY "Anyone can update confirmation count"
  ON public.reports FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create confirmations table for tracking upvotes/validations
CREATE TABLE IF NOT EXISTS public.confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_identifier TEXT, -- Can be anonymous
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view confirmations"
  ON public.confirmations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can add confirmations"
  ON public.confirmations FOR INSERT
  WITH CHECK (true);
