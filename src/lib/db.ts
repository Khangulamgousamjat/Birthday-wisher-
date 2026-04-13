import { supabase } from './supabase';

export type SurpriseData = {
  id: string; // the database uuid
  short_id: string; // the short URL id
  name: string;
  message: string;
  image_path?: string;
  music_path?: string;
  created_at: string;
};

async function uploadFile(file: File | Blob, path: string): Promise<string | null> {
  if (!supabase) return null;
  
  const { data, error } = await supabase.storage
    .from('surprises')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error("Storage upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return data.path;
}

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

export async function saveSurpriseData(record: { 
  name: string, 
  message: string, 
  imageFile?: File | Blob | null,
  musicFile?: File | null 
}): Promise<string> {
  const short_id = Math.random().toString(36).substring(2, 10);
  
  try {
    if (!supabase) {
      const errorMsg = "Supabase client is not initialized. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    let image_path = undefined;
    let music_path = undefined;

    // 1. Upload Image if exists
    if (record.imageFile) {
      const ext = record.imageFile instanceof File ? record.imageFile.name.split('.').pop() : 'jpg';
      const fileName = `${short_id}_image.${ext}`;
      image_path = await uploadFile(record.imageFile, fileName) || undefined;
    }

    // 2. Upload Music if exists
    if (record.musicFile) {
      const ext = record.musicFile.name.split('.').pop() || 'mp3';
      const fileName = `${short_id}_music.${ext}`;
      music_path = await uploadFile(record.musicFile, fileName) || undefined;
    }

    const { data, error } = await supabase
      .from('surprises')
      .insert([
        { 
          short_id, 
          name: record.name, 
          message: record.message,
          image_path: image_path,
          music_path: music_path
        }
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
