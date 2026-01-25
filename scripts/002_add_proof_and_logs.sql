-- Add proof_image_urls and completed_at to reports table
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS proof_image_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create admin_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  admin_user TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert logs (for now, simpler for MVP)
-- Ideally this would be restricted to admin role
CREATE POLICY "Anyone can insert logs"
  ON public.admin_logs FOR INSERT
  WITH CHECK (true);

-- Allow anyone to view logs
CREATE POLICY "Anyone can select logs"
  ON public.admin_logs FOR SELECT
  USING (true);
