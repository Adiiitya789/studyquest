/*
# StudyQuest: Gamified Study App Schema

## Overview
Creates the full database schema for a gamified study app with authentication,
study logging, tasks, perks, groups, and leaderboards.

## New Tables
1. `profiles` - User profile data (id refs auth.users, username, display_name, main_subject, coins, show_on_leaderboard)
2. `study_logs` - Study session records (user_id, subject, minutes, manual)
3. `tasks` - To-do items (user_id, title, done)
4. `perks` - Unlocked shop items per user (user_id, perk_id)
5. `groups` - Study squads (id, name, invite_code, owner_id)
6. `group_members` - Membership join table (group_id, user_id)

## Security (RLS)
- All tables have RLS enabled.
- Owner-scoped CRUD on profiles, study_logs, tasks, perks.
- Public profiles readable by all authenticated users (for public profile pages + leaderboards).
- Groups: owner can CRUD; members can read groups they belong to.
- Group members: members can read, users can join (insert own), owner or self can delete.

## RPCs
- `get_global_leaderboard(timeframe)` - Returns opted-in users ranked by hours studied.
- `get_group_leaderboard(p_group_id, timeframe)` - Returns members of a group ranked by hours.
- `get_public_profile(p_username)` - Returns a public profile view by username.

## Notes
- `user_id` columns default to `auth.uid()` so inserts omitting user_id succeed.
- Manual logs (manual=true) do NOT count towards coins or badges.
- Coins: 1 coin per minute of tracked study; 5 coins per completed task (app logic).
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  main_subject text NOT NULL DEFAULT 'General',
  coins integer NOT NULL DEFAULT 0,
  show_on_leaderboard boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT
  TO authenticated USING (show_on_leaderboard = true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ STUDY_LOGS ============
CREATE TABLE IF NOT EXISTS study_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  minutes integer NOT NULL DEFAULT 0,
  manual boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "study_logs_select_own" ON study_logs;
CREATE POLICY "study_logs_select_own" ON study_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "study_logs_insert_own" ON study_logs;
CREATE POLICY "study_logs_insert_own" ON study_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "study_logs_update_own" ON study_logs;
CREATE POLICY "study_logs_update_own" ON study_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "study_logs_delete_own" ON study_logs;
CREATE POLICY "study_logs_delete_own" ON study_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_study_logs_user_id ON study_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_study_logs_created_at ON study_logs(created_at);

-- ============ TASKS ============
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_select_own" ON tasks;
CREATE POLICY "tasks_select_own" ON tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_insert_own" ON tasks;
CREATE POLICY "tasks_insert_own" ON tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_update_own" ON tasks;
CREATE POLICY "tasks_update_own" ON tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_delete_own" ON tasks;
CREATE POLICY "tasks_delete_own" ON tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- ============ PERKS ============
CREATE TABLE IF NOT EXISTS perks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  perk_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, perk_id)
);

ALTER TABLE perks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perks_select_own" ON perks;
CREATE POLICY "perks_select_own" ON perks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "perks_select_public" ON perks;
CREATE POLICY "perks_select_public" ON perks FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "perks_insert_own" ON perks;
CREATE POLICY "perks_insert_own" ON perks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "perks_delete_own" ON perks;
CREATE POLICY "perks_delete_own" ON perks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_perks_user_id ON perks(user_id);

-- ============ GROUPS (table only, policies after group_members exists) ============
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text UNIQUE NOT NULL DEFAULT upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6)),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- ============ GROUP_MEMBERS ============
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- ============ GROUP POLICIES (now that group_members exists) ============
DROP POLICY IF EXISTS "groups_select_member_or_owner" ON groups;
CREATE POLICY "groups_select_member_or_owner" ON groups FOR SELECT
  TO authenticated USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "groups_insert_owner" ON groups;
CREATE POLICY "groups_insert_owner" ON groups FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "groups_update_owner" ON groups;
CREATE POLICY "groups_update_owner" ON groups FOR UPDATE
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "groups_delete_owner" ON groups;
CREATE POLICY "groups_delete_owner" ON groups FOR DELETE
  TO authenticated USING (owner_id = auth.uid());

-- ============ GROUP_MEMBERS POLICIES ============
DROP POLICY IF EXISTS "group_members_select_member" ON group_members;
CREATE POLICY "group_members_select_member" ON group_members FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm2 WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM groups g WHERE g.id = group_members.group_id AND g.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "group_members_insert_own" ON group_members;
CREATE POLICY "group_members_insert_own" ON group_members FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "group_members_delete_own_or_owner" ON group_members;
CREATE POLICY "group_members_delete_own_or_owner" ON group_members FOR DELETE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM groups g WHERE g.id = group_members.group_id AND g.owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- ============ RPC: get_global_leaderboard ============
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
  LEFT JOIN study_logs sl ON sl.user_id = p.id AND sl.manual = false
  WHERE p.show_on_leaderboard = true
    AND (
      p_timeframe = 'all'
      OR (p_timeframe = 'week' AND sl.created_at >= date_trunc('week', now()))
      OR (p_timeframe = 'month' AND sl.created_at >= date_trunc('month', now()))
    )
  GROUP BY p.id, p.username, p.display_name, p.main_subject
  ORDER BY total_minutes DESC;
END;
$$;

-- ============ RPC: get_group_leaderboard ============
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
  INNER JOIN group_members gm ON gm.user_id = p.id AND gm.group_id = p_group_id
  LEFT JOIN study_logs sl ON sl.user_id = p.id AND sl.manual = false
    AND (
      p_timeframe = 'all'
      OR (p_timeframe = 'week' AND sl.created_at >= date_trunc('week', now()))
      OR (p_timeframe = 'month' AND sl.created_at >= date_trunc('month', now()))
    )
  GROUP BY p.id, p.username, p.display_name, p.main_subject
  ORDER BY total_minutes DESC;
END;
$$;

-- ============ RPC: get_public_profile ============
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
  WHERE p.username = p_username
  LIMIT 1;
END;
$$;
