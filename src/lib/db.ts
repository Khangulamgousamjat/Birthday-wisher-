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
      if (error) console.error("Supabase Error fetch:", error.message, error.details, error.hint);
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
  
  try {
    if (!supabase) {
      const errorMsg = "Supabase client is not initialized. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const payloadSize = new Blob([record.message]).size;
    if (payloadSize > 8 * 1024 * 1024) { // 8MB limit for safety
      throw new Error(`Payload too large (${(payloadSize / 1024 / 1024).toFixed(2)}MB). Try using smaller music or image files.`);
    }

    const { data, error } = await supabase
      .from('surprises')
      .insert([
        { short_id, name: record.name, message: record.message }
      ])
      .select('short_id')
      .single();
  
    if (error) {
      console.error("Supabase Error insert:", error.message, error.details, error.hint);
      if (error.code === '57014') throw new Error("Request timed out. The file might be too large.");
      if (error.message.includes("quota") || error.message.includes("full")) {
        throw new Error("Database storage quota exceeded. Please check your Supabase dashboard.");
      }
      throw new Error(error.message);
    }
  
    return data.short_id;
  } catch (err: any) {
    console.error("Failed to save surprise data:", err);
    throw err;
  }
}
