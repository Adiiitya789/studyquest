/*
# Filter Unverified/Unconfirmed Users from Leaderboards and Public Profiles

## Overview
Ensures that users who have registered but have not yet verified/confirmed their email
do not appear on global leaderboards, squad leaderboards, or public profiles.

## Changes
- Updates `get_global_leaderboard`: Requires `auth.users.email_confirmed_at IS NOT NULL`.
- Updates `get_group_leaderboard`: Requires `auth.users.email_confirmed_at IS NOT NULL`.
- Updates `get_public_profile`: Requires `auth.users.email_confirmed_at IS NOT NULL`.
*/

-- ============ 1. RPC: get_global_leaderboard ============
CREATE OR REPLACE FUNCTION get_global_leaderboard(p_timeframe text DEFAULT 'all')
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  main_subject text,
  total_minutes integer,
  total_hours numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.username,
    p.display_name,
    p.main_subject,
    COALESCE(SUM(sl.minutes), 0)::integer AS total_minutes,
    ROUND(COALESCE(SUM(sl.minutes), 0) / 60.0, 2) AS total_hours
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  LEFT JOIN study_logs sl ON sl.user_id = p.id AND sl.manual = false
    AND (
      p_timeframe = 'all'
      OR (p_timeframe = 'week' AND sl.created_at >= date_trunc('week', now()))
      OR (p_timeframe = 'month' AND sl.created_at >= date_trunc('month', now()))
    )
  WHERE p.show_on_leaderboard = true
    AND u.email_confirmed_at IS NOT NULL
  GROUP BY p.id, p.username, p.display_name, p.main_subject
  HAVING (p_timeframe = 'all' OR COALESCE(SUM(sl.minutes), 0) > 0)
  ORDER BY total_minutes DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_global_leaderboard(text) FROM anon;
GRANT EXECUTE ON FUNCTION get_global_leaderboard(text) TO authenticated;


-- ============ 2. RPC: get_group_leaderboard ============
CREATE OR REPLACE FUNCTION get_group_leaderboard(p_group_id uuid, p_timeframe text DEFAULT 'all')
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  main_subject text,
  total_minutes integer,
  total_hours numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.username,
    p.display_name,
    p.main_subject,
    COALESCE(SUM(sl.minutes), 0)::integer AS total_minutes,
    ROUND(COALESCE(SUM(sl.minutes), 0) / 60.0, 2) AS total_hours
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  INNER JOIN group_members gm ON gm.user_id = p.id AND gm.group_id = p_group_id
  LEFT JOIN study_logs sl ON sl.user_id = p.id AND sl.manual = false
    AND (
      p_timeframe = 'all'
      OR (p_timeframe = 'week' AND sl.created_at >= date_trunc('week', now()))
      OR (p_timeframe = 'month' AND sl.created_at >= date_trunc('month', now()))
    )
  WHERE u.email_confirmed_at IS NOT NULL
  GROUP BY p.id, p.username, p.display_name, p.main_subject
  ORDER BY total_minutes DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_group_leaderboard(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION get_group_leaderboard(uuid, text) TO authenticated;


-- ============ 3. RPC: get_public_profile ============
CREATE OR REPLACE FUNCTION get_public_profile(p_username text)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  main_subject text,
  total_minutes integer,
  total_hours numeric,
  tasks_done integer,
  perk_ids text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.username,
    p.display_name,
    p.main_subject,
    COALESCE((SELECT SUM(minutes) FROM study_logs WHERE user_id = p.id AND manual = false), 0)::integer AS total_minutes,
    ROUND(COALESCE((SELECT SUM(minutes) FROM study_logs WHERE user_id = p.id AND manual = false), 0) / 60.0, 2) AS total_hours,
    COALESCE((SELECT COUNT(*) FROM tasks WHERE user_id = p.id AND done = true), 0)::integer AS tasks_done,
    COALESCE((SELECT array_agg(perk_id) FROM perks WHERE user_id = p.id), ARRAY[]::text[]) AS perk_ids
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.username = p_username
    AND u.email_confirmed_at IS NOT NULL
  LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_public_profile(text) FROM anon;
GRANT EXECUTE ON FUNCTION get_public_profile(text) TO authenticated;

