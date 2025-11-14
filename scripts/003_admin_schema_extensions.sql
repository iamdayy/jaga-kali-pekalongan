-- Add admin fields to reports table
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS last_updated_by TEXT;

-- Create admin action logs table for tracking changes
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'status_update', 'note_added', 'assigned', 'exported'
  admin_user TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on admin logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Admin logs are only for viewing (admin only)
CREATE POLICY "Only view admin logs for reports"
  ON public.admin_logs FOR SELECT
  USING (true);

-- Create a helper function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_report_id UUID,
  p_action TEXT,
  p_admin_user TEXT,
  p_details JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.admin_logs (report_id, action, admin_user, details)
  VALUES (p_report_id, p_action, p_admin_user, p_details)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;
