import { supabase } from './supabase';

export interface LeaderboardEntry {
  id: number;
  nickname: string;
  score: number;
  kills: number;
  level: number;
  time_seconds: number;
  created_at: string;
}

export async function saveScore(entry: {
  nickname: string;
  score: number;
  kills: number;
  level: number;
  time_seconds: number;
}): Promise<void> {
  const { error } = await supabase.from('leaderboard').insert(entry);
  if (error) console.error('leaderboard save error:', error.message);
}

export async function getTopScores(limit = 10): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(limit);
  if (error) console.error('leaderboard fetch error:', error.message);
  return data ?? [];
}
