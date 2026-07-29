import { supabase } from '@/lib/supabase';

export async function isCreator(): Promise<boolean> {
  const { data, error } = await supabase
    .from('creators')
    .select('user_id')
    .maybeSingle();
  if (error) {
    console.error('Failed to check creator status:', error.message);
    return false;
  }
  return !!data;
}

export interface AdminAppRating {
  id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
  user_email: string | null;
}

export interface AdminAnalysisRating {
  id: string;
  rating: number | null;
  rating_feedback: string | null;
  recommended_shoe: string;
  brand: string;
  activity_label: string;
  created_at: string;
  user_email: string | null;
}

export async function getAllAppRatings(): Promise<AdminAppRating[]> {
  const { data, error } = await supabase
    .from('app_ratings')
    .select('id, rating, feedback, created_at, user_id');
  if (error || !data) return [];

  const ratings = data as (AdminAppRating & { user_id: string })[];
  const emails = await Promise.all(
    ratings.map((r) => supabase.auth.admin.listUsers())
  );
  // admin API not available via anon key; fall back to no email
  return ratings.map(({ user_id, ...r }) => ({ ...r, user_email: null }));
}

export async function getAllAnalysisRatings(): Promise<AdminAnalysisRating[]> {
  const { data, error } = await supabase
    .from('analyses')
    .select('id, rating, rating_feedback, recommended_shoe, brand, activity_label, created_at')
    .not('rating', 'is', null)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as AdminAnalysisRating[];
}

export async function clearAllAppRatings(): Promise<boolean> {
  const { error } = await supabase.from('app_ratings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) {
    console.error('Failed to clear app ratings:', error.message);
    return false;
  }
  return true;
}

export async function clearAllAnalysisRatings(): Promise<boolean> {
  const { error } = await supabase
    .from('analyses')
    .update({ rating: null, rating_feedback: null })
    .not('rating', 'is', null);
  if (error) {
    console.error('Failed to clear analysis ratings:', error.message);
    return false;
  }
  return true;
}
