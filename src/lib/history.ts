import { supabase } from '@/lib/supabase';
import type { AnalysisResult } from '@/data/shoes';

export interface SavedAnalysis {
  id: string;
  created_at: string;
  activity: string;
  activity_label: string;
  foot_length: string;
  shoe_size_uk: string;
  shoe_size_us: string;
  shoe_size_eu: string;
  foot_type: string;
  foot_type_label: string;
  recommended_shoe: string;
  brand: string;
  image: string;
  reason: string;
  confidence: number;
  comfort: number;
  support: number;
  durability: number;
  price_range: string;
  tags: string[];
  rating?: number | null;
  rating_feedback?: string | null;
}

export async function saveAnalysis(result: AnalysisResult): Promise<SavedAnalysis | null> {
  const { data, error } = await supabase
    .from('analyses')
    .insert({
      activity: result.activity,
      activity_label: result.activity_label,
      foot_length: result.foot_length,
      shoe_size_uk: result.shoe_size.uk,
      shoe_size_us: result.shoe_size.us,
      shoe_size_eu: result.shoe_size.eu,
      foot_type: result.foot_type,
      foot_type_label: result.foot_type_label,
      recommended_shoe: result.recommended_shoe,
      brand: result.brand,
      image: result.image,
      reason: result.reason,
      confidence: result.confidence,
      comfort: result.comfort,
      support: result.support,
      durability: result.durability,
      price_range: result.priceRange,
      tags: result.tags,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save analysis:', error.message);
    return null;
  }
  return data as SavedAnalysis;
}

export async function updateAnalysisRating(id: string, rating: number, feedback?: string): Promise<boolean> {
  const { error } = await supabase
    .from('analyses')
    .update({ rating, rating_feedback: feedback ?? null })
    .eq('id', id);
  if (error) {
    console.error('Failed to update analysis rating:', error.message);
    return false;
  }
  return true;
}

export async function getAnalysisRating(id: string): Promise<{ rating: number | null; feedback: string | null }> {
  const { data, error } = await supabase
    .from('analyses')
    .select('rating, rating_feedback')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) {
    return { rating: null, feedback: null };
  }
  return { rating: data.rating, feedback: data.rating_feedback };
}

export async function loadHistory(): Promise<SavedAnalysis[]> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to load history:', error.message);
    return [];
  }
  return (data ?? []) as SavedAnalysis[];
}

export async function deleteAnalysis(id: string): Promise<boolean> {
  const { error } = await supabase.from('analyses').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete analysis:', error.message);
    return false;
  }
  return true;
}
