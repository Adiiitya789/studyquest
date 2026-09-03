/*
# Add VIP Role & Badging Support

## Overview
Adds a manual `is_vip` boolean flag to the `profiles` table and updates
all leaderboard, public profile, and admin RPCs so that the VIP badge
is returned across the application.

## Changes
1. Adds `is_vip` column to `profiles` (default: false).
2. Updates `get_global_leaderboard` RPC to include `is_vip`.
3. Updates `get_group_leaderboard` RPC to include `is_vip`.
4. Updates `get_public_profile` RPC to include `is_vip`.
5. Updates `get_admin_dashboard` RPC to include `is_vip`.
6. Adds `set_user_vip(target_user_id uuid, p_is_vip boolean)` admin RPC.
*/

-- ============ 1. Add is_vip column to profiles ============
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_vip boolean NOT NULL DEFAULT false;


-- ============ 2. RPC: get_global_leaderboard ============
DROP FUNCTION IF EXISTS get_global_leaderboard(text);

CREATE OR REPLACE FUNCTION get_global_leaderboard(p_timeframe text DEFAULT 'all')
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  main_subject text,
  total_minutes integer,
  total_hours numeric,
  is_vip boolean
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
    ROUND(COALESCE(SUM(sl.minutes), 0) / 60.0, 2) AS total_hours,
    p.is_vip
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
  GROUP BY p.id, p.username, p.display_name, p.main_subject, p.is_vip
  HAVING (p_timeframe = 'all' OR COALESCE(SUM(sl.minutes), 0) > 0)
  ORDER BY total_minutes DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_global_leaderboard(text) FROM anon;
GRANT EXECUTE ON FUNCTION get_global_leaderboard(text) TO authenticated;


-- ============ 3. RPC: get_group_leaderboard ============
DROP FUNCTION IF EXISTS get_group_leaderboard(uuid, text);

CREATE OR REPLACE FUNCTION get_group_leaderboard(p_group_id uuid, p_timeframe text DEFAULT 'all')
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  main_subject text,
  total_minutes integer,
  total_hours numeric,
  is_vip boolean
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
    ROUND(COALESCE(SUM(sl.minutes), 0) / 60.0, 2) AS total_hours,
    p.is_vip
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
  GROUP BY p.id, p.username, p.display_name, p.main_subject, p.is_vip
  ORDER BY total_minutes DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_group_leaderboard(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION get_group_leaderboard(uuid, text) TO authenticated;


-- ============ 4. RPC: get_public_profile ============
DROP FUNCTION IF EXISTS get_public_profile(text);

CREATE OR REPLACE FUNCTION get_public_profile(p_username text)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  main_subject text,
  total_minutes integer,
  total_hours numeric,
  tasks_done integer,
  perk_ids text[],
  is_vip boolean
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
    COALESCE((SELECT array_agg(perk_id) FROM perks WHERE user_id = p.id), ARRAY[]::text[]) AS perk_ids,
    p.is_vip
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.username = p_username
    AND u.email_confirmed_at IS NOT NULL
  LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_public_profile(text) FROM anon;
GRANT EXECUTE ON FUNCTION get_public_profile(text) TO authenticated;


-- ============ 5. RPC: get_admin_dashboard ============
DROP FUNCTION IF EXISTS get_admin_dashboard();

CREATE OR REPLACE FUNCTION get_admin_dashboard()
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  email text,
  main_subject text,
  coins integer,
  total_minutes integer,
  total_hours numeric,
  tasks_done integer,
  perks_count integer,
  is_admin boolean,
  show_on_leaderboard boolean,
  created_at timestamptz,
  is_vip boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_is_admin boolean;
BEGIN
  SELECT p.is_admin INTO v_caller_is_admin FROM profiles p WHERE p.id = auth.uid();
  IF NOT COALESCE(v_caller_is_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: only admins can view the dashboard.';
  END IF;

  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.username,
    p.display_name,
    u.email::text,
    p.main_subject,
    p.coins,
    COALESCE(SUM(sl.minutes) FILTER (WHERE sl.manual = false), 0)::integer AS total_minutes,
    ROUND(COALESCE(SUM(sl.minutes) FILTER (WHERE sl.manual = false), 0) / 60.0, 2) AS total_hours,
    COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.user_id = p.id AND t.done = true), 0)::integer AS tasks_done,
    COALESCE((SELECT COUNT(*) FROM perks pr WHERE pr.user_id = p.id), 0)::integer AS perks_count,
    p.is_admin,
    p.show_on_leaderboard,
    p.created_at,
    p.is_vip
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  LEFT JOIN study_logs sl ON sl.user_id = p.id
  GROUP BY p.id, p.username, p.display_name, u.email, p.main_subject, p.coins, p.is_admin, p.show_on_leaderboard, p.created_at, p.is_vip
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_admin_dashboard() FROM anon;
GRANT EXECUTE ON FUNCTION get_admin_dashboard() TO authenticated;


-- ============ 6. RPC: set_user_vip (Admin toggle) ============
CREATE OR REPLACE FUNCTION set_user_vip(target_user_id uuid, p_is_vip boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_is_admin boolean;
BEGIN
  SELECT p.is_admin INTO v_caller_is_admin FROM profiles p WHERE p.id = auth.uid();
  IF NOT COALESCE(v_caller_is_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: only admins can set VIP status.';
  END IF;

  UPDATE profiles
  SET is_vip = p_is_vip
  WHERE id = target_user_id;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_user_vip(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION set_user_vip(uuid, boolean) TO authenticated;
