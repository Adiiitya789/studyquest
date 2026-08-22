/*
# Coin rate: 1 coin per minute of tracked study

## Overview
Previously coins were awarded at 1 coin per 5 minutes of tracked study.
This changes the rate to 1 coin per minute.

## Why this migration exists
The `log_study_session` RPC (referenced from src/pages/Room.tsx) is the
function that actually inserts the study_logs row and credits
profiles.coins server-side. It was not present in the exported migration
history for this project, so it is (re)created here with the corrected
rate. If a version of this function already exists in your database with
additional logic (streaks, badges, daily caps, etc.), review this
definition before applying it and fold that logic back in — this
CREATE OR REPLACE will otherwise overwrite it.

## Changes
- CREATE OR REPLACE FUNCTION log_study_session(p_subject text, p_minutes integer)
  - Inserts a study_logs row for the caller (manual = false).
  - Credits profiles.coins by floor(p_minutes / 1) = p_minutes (was p_minutes / 5).
  - SECURITY DEFINER so it can update profiles.coins even though clients
    cannot write that column directly (mirrors the other RPCs in this schema).
- EXECUTE is restricted to the authenticated role only, matching the
  restriction already applied to the other RPCs.
*/

CREATE OR REPLACE FUNCTION log_study_session(p_subject text, p_minutes integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coins integer;
BEGIN
  IF p_minutes IS NULL OR p_minutes < 1 THEN
    RAISE EXCEPTION 'p_minutes must be a positive integer';
  END IF;

  v_coins := floor(p_minutes / 1.0)::integer;

  INSERT INTO study_logs (user_id, subject, minutes, manual)
  VALUES (auth.uid(), p_subject, p_minutes, false);

  UPDATE profiles
  SET coins = coins + v_coins
  WHERE id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION log_study_session(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION log_study_session(text, integer) TO authenticated;
