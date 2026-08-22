/*
# Admin ("God Panel") support

## Overview
The Admin page (src/pages/Admin.tsx) needs three things that were referenced
in the frontend but never actually existed in the database:

1. A `profiles.is_admin` column — without it, `profile.is_admin` is always
   undefined/false for everyone, so the Admin page always redirects to the
   dashboard no matter who's logged in.
2. `get_admin_dashboard()` — returns one row per user with their email,
   coins, hours studied, tasks done, and perk count, bypassing the normal
   per-user RLS restrictions (admins need to see every user, including
   those who opted out of the public leaderboard). Restricted to callers
   whose own profiles.is_admin is true.
3. `god_mode_add_coins(target_email, coin_amount)` — adds (or, with a
   negative amount, removes) coins from any user's wallet, looked up by
   email. Also restricted to admins. Balances are clamped to never go
   below 0.

## IMPORTANT — before running this
Edit the email address in the `UPDATE profiles ...` statement near the
bottom to your own login email, so your account is the one that gets
admin access. Nobody else's account is affected.
*/

-- ============ is_admin column ============
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- ============ RPC: get_admin_dashboard ============
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
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT COALESCE((SELECT p.is_admin FROM profiles p WHERE p.id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.username,
    p.display_name,
    u.email::text,
    p.main_subject,
    p.coins,
    COALESCE((SELECT SUM(sl.minutes) FROM study_logs sl WHERE sl.user_id = p.id AND sl.manual = false), 0)::integer AS total_minutes,
    ROUND(COALESCE((SELECT SUM(sl.minutes) FROM study_logs sl WHERE sl.user_id = p.id AND sl.manual = false), 0) / 60.0, 2) AS total_hours,
    COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.user_id = p.id AND t.done = true), 0)::integer AS tasks_done,
    COALESCE((SELECT COUNT(*) FROM perks pk WHERE pk.user_id = p.id), 0)::integer AS perks_count,
    p.is_admin,
    p.show_on_leaderboard,
    p.created_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_admin_dashboard() FROM anon;
GRANT EXECUTE ON FUNCTION get_admin_dashboard() TO authenticated;

-- ============ RPC: god_mode_add_coins ============
CREATE OR REPLACE FUNCTION god_mode_add_coins(target_email text, coin_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_is_admin boolean;
  v_target_id uuid;
BEGIN
  SELECT p.is_admin INTO v_caller_is_admin FROM profiles p WHERE p.id = auth.uid();
  IF NOT COALESCE(v_caller_is_admin, false) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT u.id INTO v_target_id FROM auth.users u WHERE u.email = target_email;
  IF v_target_id IS NULL THEN
    RAISE EXCEPTION 'No user found with that email';
  END IF;

  UPDATE profiles
  SET coins = GREATEST(coins + coin_amount, 0)
  WHERE id = v_target_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION god_mode_add_coins(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION god_mode_add_coins(text, integer) TO authenticated;

-- ============ Make your account an admin ============
-- ⚠️ Replace the email below with your own login email before running.
UPDATE profiles
SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_LOGIN_EMAIL_HERE');
