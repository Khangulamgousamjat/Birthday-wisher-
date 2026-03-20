import { supabase } from './supabase';

export type SurpriseData = {
  id: string; // the database uuid
  short_id: string; // the short URL id
  name: string;
  message: string;
  created_at: string;
};

export async function getSurpriseData(short_id: string): Promise<SurpriseData | null> {
  try {
    if (!supabase) {
      console.error("Supabase client is not initialized. Check your environment variables.");
      return null;
    }
    const { data, error } = await supabase
      .from('surprises')
      .select('*')
      .eq('short_id', short_id)
      .single();

    if (error || !data) {
      console.error("Supabase Error fetch:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unknown error fetch:", error);
    return null;
  }
}

export async function saveSurpriseData(record: { name: string, message: string }): Promise<string> {
  const short_id = Math.random().toString(36).substring(2, 10);
  
  if (!supabase) {
    const errorMsg = "Supabase client is not initialized. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const { data, error } = await supabase
    .from('surprises')
    .insert([
      { short_id, name: record.name, message: record.message }
    ])
    .select('short_id')
    .single();

  if (error) {
    console.error("Supabase Error insert:", error);
    throw new Error(error.message);
  }

  return data.short_id;
}
