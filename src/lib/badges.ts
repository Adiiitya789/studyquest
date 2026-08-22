import type { BadgeDef } from '@/lib/types';
import { BADGES } from '@/lib/constants';
import { Sprout, BookOpen, GraduationCap, Brain, Award, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Sprout, BookOpen, GraduationCap, Brain, Award, Trophy,
};

export function getBadgeIcon(badge: BadgeDef) {
  return iconMap[badge.icon] ?? Award;
}

export function getUnlockedBadges(totalHours: number): BadgeDef[] {
  return BADGES.filter((b) => totalHours >= b.hours);
}

export function getNextBadge(totalHours: number): BadgeDef | null {
  return BADGES.find((b) => totalHours < b.hours) ?? null;
}
