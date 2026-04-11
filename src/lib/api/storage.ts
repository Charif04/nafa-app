import { supabase } from '@/lib/supabase';

/**
 * Upload a product image.
 * Path: products/{vendorId}/{timestamp}_{filename}
 * Returns the public URL.
 */
export async function uploadProductImage(
  vendorId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${vendorId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('products')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from('products').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload multiple product images. Returns array of public URLs.
 */
export async function uploadProductImages(
  vendorId: string,
  files: File[]
): Promise<string[]> {
  return Promise.all(files.map((f) => uploadProductImage(vendorId, f)));
}

/**
 * Delete a product image by its public URL.
 */
export async function deleteProductImage(publicUrl: string): Promise<void> {
  const url = new URL(publicUrl);
  // Path after /storage/v1/object/public/products/
  const path = url.pathname.split('/products/')[1];
  if (!path) return;
  await supabase.storage.from('products').remove([path]);
}

/**
 * Upload user avatar.
 * Path: avatars/{userId}/{timestamp}.{ext}
 * Returns the public URL.
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { cacheControl: '3600', upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload CNIB document (private bucket).
 * Path: cnib/{userId}/{timestamp}.{ext}
 * Returns the storage path (not a public URL — use signed URL to access).
 */
export async function uploadCnib(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('cnib')
    .upload(path, file, { cacheControl: '3600', upsert: true });

  if (error) throw error;
  return path;
}

/**
 * Get a temporary signed URL for a private CNIB document (valid 1 hour).
 */
export async function getCnibSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('cnib')
    .createSignedUrl(path, 3600);

  if (error) throw error;
  return data.signedUrl;
}
