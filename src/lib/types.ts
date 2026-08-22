export interface Profile {
  id: string;
  username: string;
  display_name: string;
  main_subject: string;
  coins: number;
  show_on_leaderboard: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface StudyLog {
  id: string;
  user_id: string;
  subject: string;
  minutes: number;
  manual: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  done: boolean;
  created_at: string;
}

export interface Perk {
  id: string;
  user_id: string;
  perk_id: string;
  created_at: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  display_name: string;
  main_subject: string;
  total_minutes: number;
  total_hours: number;
}

export interface PublicProfile {
  user_id: string;
  username: string;
  display_name: string;
  main_subject: string;
  total_minutes: number;
  total_hours: number;
  tasks_done: number;
  perk_ids: string[];
}

export interface PerkDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

export interface BadgeDef {
  id: string;
  name: string;
  hours: number;
  icon: string;
}
