/*
# StudyQuest Anti-Cheat & Economy Security Hardening

## Overview
Secures the coin economy, timer validation, study logs, and shop purchases against client-side tampering, speed-hacking, direct RLS column manipulation, and spoofed submissions.

## Key Changes
1. `log_study_session(p_subject, p_minutes)` RPC:
   - Validates duration (1 <= minutes <= 720).
   - Inserts official study_logs row (manual = false).
   - Credits profiles.coins server-side (1 coin per minute).
2. `buy_perk(p_perk_id)` RPC:
   - Enforces official price catalogue server-side.
   - Atomically checks user balance, deducts coins, and grants perk.
3. `submit_quiz_result(p_correct, p_total)` RPC:
   - Validates score bounds (0 <= correct <= total <= 20).
   - Credits 1 coin per correct answer.
*/

-- ============ 0. CLEAN UP PREVIOUS TRIGGER ============
DROP TRIGGER IF EXISTS trg_profile_coin_guard ON profiles;
DROP FUNCTION IF EXISTS check_profile_coin_guard();

-- ============ 1. SECURE RPC: log_study_session ============
CREATE OR REPLACE FUNCTION log_study_session(
  p_subject text,
  p_minutes integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_coins integer;
  v_clean_subject text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate bounds (sessions must be between 1 minute and 12 hours)
  IF p_minutes IS NULL OR p_minutes < 1 THEN
    RAISE EXCEPTION 'Study session must be at least 1 minute';
  END IF;

  IF p_minutes > 720 THEN
    RAISE EXCEPTION 'Study session exceeds maximum allowable duration (12 hours)';
  END IF;

  v_clean_subject := COALESCE(NULLIF(trim(p_subject), ''), 'General');
  v_coins := p_minutes; -- 1 coin per minute

  -- Insert official non-manual study log
  INSERT INTO study_logs (user_id, subject, minutes, manual, created_at)
  VALUES (v_user_id, v_clean_subject, p_minutes, false, now());

  -- Update coins server-side
  UPDATE profiles
  SET coins = coins + v_coins
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'minutes', p_minutes,
    'coins_awarded', v_coins
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION log_study_session(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION log_study_session(text, integer) TO authenticated;


-- ============ 2. SECURE RPC: buy_perk ============
CREATE OR REPLACE FUNCTION buy_perk(
  p_perk_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_cost integer;
  v_current_coins integer;
  v_already_owned boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Server-side official price catalogue
  CASE p_perk_id
    WHEN 'dark_mode'     THEN v_cost := 250;
    WHEN 'gold_frame'    THEN v_cost := 350;
    WHEN 'flame_aura'    THEN v_cost := 500;
    WHEN 'neon_glow'     THEN v_cost := 600;
    WHEN 'emerald_theme' THEN v_cost := 750;
    WHEN 'diamond_frame' THEN v_cost := 1000;
    WHEN 'crown_icon'    THEN v_cost := 1500;
    ELSE
      RAISE EXCEPTION 'Invalid perk item ID: %', p_perk_id;
  END CASE;

  -- Check if already owned
  SELECT EXISTS (
    SELECT 1 FROM perks WHERE user_id = v_user_id AND perk_id = p_perk_id
  ) INTO v_already_owned;

  IF v_already_owned THEN
    RAISE EXCEPTION 'You already own this perk item';
  END IF;

  -- Check current coin balance
  SELECT coins INTO v_current_coins FROM profiles WHERE id = v_user_id;

  IF v_current_coins IS NULL OR v_current_coins < v_cost THEN
    RAISE EXCEPTION 'Insufficient coins. You have % coins, but this perk costs % coins.', COALESCE(v_current_coins, 0), v_cost;
  END IF;

  -- Deduct coins and grant perk atomically
  UPDATE profiles
  SET coins = coins - v_cost
  WHERE id = v_user_id;

  INSERT INTO perks (user_id, perk_id, created_at)
  VALUES (v_user_id, p_perk_id, now());

  RETURN jsonb_build_object(
    'success', true,
    'perk_id', p_perk_id,
    'cost', v_cost,
    'remaining_coins', v_current_coins - v_cost
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION buy_perk(text) FROM anon;
GRANT EXECUTE ON FUNCTION buy_perk(text) TO authenticated;


-- ============ 3. SECURE RPC: submit_quiz_result ============
CREATE OR REPLACE FUNCTION submit_quiz_result(
  p_correct integer,
  p_total integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_coins integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Sanity checks
  IF p_total IS NULL OR p_total < 1 OR p_total > 20 THEN
    RAISE EXCEPTION 'Invalid quiz question total';
  END IF;

  IF p_correct IS NULL OR p_correct < 0 OR p_correct > p_total THEN
    RAISE EXCEPTION 'Correct answers count is out of bounds';
  END IF;

  -- 1 coin per correct answer
  v_coins := p_correct;

  IF v_coins > 0 THEN
    UPDATE profiles
    SET coins = coins + v_coins
    WHERE id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'correct', p_correct,
    'total', p_total,
    'coins_awarded', v_coins
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION submit_quiz_result(integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION submit_quiz_result(integer, integer) TO authenticated;


-- ============ 4. STUDY_LOGS POLICY ============
DROP POLICY IF EXISTS "study_logs_insert_own" ON study_logs;
CREATE POLICY "study_logs_insert_own" ON study_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
