/*
# Restrict RPC execution to authenticated role

## Overview
Revoke EXECUTE on the three public RPCs from the anon role so only signed-in
users can call them. The app requires authentication, so anon access to these
functions is unnecessary.

## Changes
- REVOKE EXECUTE on get_global_leaderboard, get_group_leaderboard, get_public_profile from anon.
- GRANT EXECUTE to authenticated only.
*/

REVOKE EXECUTE ON FUNCTION get_global_leaderboard(text) FROM anon;
REVOKE EXECUTE ON FUNCTION get_group_leaderboard(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION get_public_profile(text) FROM anon;

GRANT EXECUTE ON FUNCTION get_global_leaderboard(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_group_leaderboard(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_profile(text) TO authenticated;
