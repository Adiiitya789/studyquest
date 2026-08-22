import type { PerkDef, BadgeDef } from './types';

export const PERKS: PerkDef[] = [
  { id: 'gold_frame', name: 'Gold Frame', description: 'Gold border on your profile', cost: 100, icon: 'Frame' },
  { id: 'crystal_badge', name: 'Crystal Badge', description: 'A shimmering crystal icon', cost: 150, icon: 'Gem' },
  { id: 'neon_glow', name: 'Neon Glow', description: 'Glowing accent on your name', cost: 200, icon: 'Sparkles' },
  { id: 'crown_icon', name: 'Crown Icon', description: 'A royal crown next to your name', cost: 500, icon: 'Crown' },
  { id: 'flame_aura', name: 'Flame Aura', description: 'A fiery aura on your profile', cost: 750, icon: 'Flame' },
  { id: 'diamond_frame', name: 'Diamond Frame', description: 'A dazzling diamond border', cost: 1000, icon: 'Diamond' },
];

export const BADGES: BadgeDef[] = [
  { id: 'novice', name: 'Novice', hours: 1, icon: 'Sprout' },
  { id: 'scholar', name: 'Scholar', hours: 5, icon: 'BookOpen' },
  { id: 'adept', name: 'Adept', hours: 25, icon: 'GraduationCap' },
  { id: 'expert', name: 'Expert', hours: 50, icon: 'Brain' },
  { id: 'master', name: 'Master', hours: 100, icon: 'Award' },
  { id: 'legend', name: 'Legend', hours: 250, icon: 'Trophy' },
];

export const SUBJECTS = [
  'Mathematics',
  'Science',
  'Computer Science',
  'Art',
  'Business',
  'Psychology',
  'Engineering',
  'Medicine',
  'General',
];

export function coinsForMinutes(minutes: number): number {
  return Math.floor(minutes / 1);
}

export function coinsForTask(): number {
  return 5;
}
