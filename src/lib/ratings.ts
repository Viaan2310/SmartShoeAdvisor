import { supabase } from '@/lib/supabase';

export interface AppRating {
  id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
}

export async function getUserRating(): Promise<AppRating | null> {
  const { data, error } = await supabase
    .from('app_ratings')
    .select('id, rating, feedback, created_at')
    .maybeSingle();
  if (error) {
    console.error('Failed to load rating:', error.message);
    return null;
  }
  return data as AppRating | null;
}

export async function saveUserRating(rating: number, feedback?: string): Promise<boolean> {
  const { error } = await supabase
    .from('app_ratings')
    .upsert({ rating, feedback: feedback ?? null }, { onConflict: 'user_id' });
  if (error) {
    console.error('Failed to save rating:', error.message);
    return false;
  }
  return true;
}

export async function getRatingStats(): Promise<{ average: number; count: number }> {
  const { data, error } = await supabase
    .from('app_ratings')
    .select('rating');
  if (error || !data || data.length === 0) {
    return { average: 0, count: 0 };
  }
  const sum = data.reduce((acc, r) => acc + r.rating, 0);
  return { average: sum / data.length, count: data.length };
}
