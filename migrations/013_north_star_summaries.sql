-- Add summary columns for North Star
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS building_description_summary TEXT,
ADD COLUMN IF NOT EXISTS current_goal_summary TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_building_description_summary ON public.users (building_description_summary);
CREATE INDEX IF NOT EXISTS idx_users_current_goal_summary ON public.users (current_goal_summary);

