import { db, storage } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export type SurpriseData = {
  id: string; // Firestore document ID (which is the short_id)
  short_id: string; // The short URL id
  name: string;
  message: string;
  image_path?: string; // Stored as direct Firebase download URL
  music_path?: string; // Stored as direct Firebase download URL
  created_at: string;
};

// Helper function to enforce a timeout on asynchronous tasks
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

async function uploadFile(file: File | Blob, path: string): Promise<string | null> {
  try {
    const storageRef = ref(storage, `surprises/${path}`);
    console.log(`Uploading file to: surprises/${path}`);
    
    // Set a 15-second timeout for the file upload
    const snapshot = await withTimeout(
      uploadBytes(storageRef, file), 
      15000, 
      "File upload timed out. Please check your Firebase Storage setup and connection."
    );
    
    console.log("File uploaded successfully, retrieving download URL...");
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    console.error("Storage upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

export async function getSurpriseData(short_id: string): Promise<SurpriseData | null> {
  try {
    const docRef = doc(db, 'surprises', short_id);
    
    // Set a 10-second timeout for reading Firestore
    const docSnap = await withTimeout(
      getDoc(docRef),
      10000,
      "Reading database timed out. Please check your Firebase connection."
    );

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      short_id: data.short_id,
      name: data.name,
      message: data.message,
      image_path: data.image_path || undefined,
      music_path: data.music_path || undefined,
      created_at: data.created_at,
    };
  } catch (error: any) {
    console.error("Error fetching surprise data from Firestore:", error);
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

    // 3. Save surprise details in Firestore surprises collection
    console.log("Writing document to Firestore surprises collection...");
    await withTimeout(
      setDoc(doc(db, 'surprises', short_id), {
        short_id,
        name: record.name,
        message: record.message,
        image_path: image_path || null,
        music_path: music_path || null,
        created_at: new Date().toISOString()
      }),
      10000,
      "Database save timed out. Please check your Firestore database setup and internet connection."
    );
  
    console.log("Document saved successfully with ID:", short_id);
    return short_id;
  } catch (err: any) {
    console.error("Failed to save surprise data to Firestore:", err);
    throw err;
  }
}
