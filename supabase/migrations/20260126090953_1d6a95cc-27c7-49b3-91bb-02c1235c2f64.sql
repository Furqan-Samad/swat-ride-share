-- Fix the overly permissive INSERT policy for notifications
-- Notifications should only be inserted by authenticated users or service role
DROP POLICY IF EXISTS "System can insert notifications for any user" ON public.notifications;

CREATE POLICY "Authenticated users can receive notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  -- Allow insertion for authenticated users
  auth.role() = 'authenticated' OR auth.role() = 'service_role'
);