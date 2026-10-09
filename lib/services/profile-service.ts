/**
 * Profile Service
 * Handles profile-related operations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { Profile, ProfileUpdate } from '@/lib/supabase/types';
import type { Address } from '@/types';

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Get user profile by ID
 */
export async function getProfile(
  supabase: SupabaseClientType,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

/**
 * Update user profile
 */
export async function updateProfile(
  supabase: SupabaseClientType,
  userId: string,
  updates: ProfileUpdate
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }

  return data;
}

/**
 * Update profile avatar
 */
export async function updateAvatar(
  supabase: SupabaseClientType,
  userId: string,
  avatarUrl: string
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);

  if (error) {
    console.error('Error updating avatar:', error);
    return false;
  }

  return true;
}

/**
 * Update profile address
 */
export async function updateAddress(
  supabase: SupabaseClientType,
  userId: string,
  address: Address
): Promise<boolean> {
  // Validate coordinates
  if (
    address.coordinates.lat < -90 ||
    address.coordinates.lat > 90 ||
    address.coordinates.lng < -180 ||
    address.coordinates.lng > 180
  ) {
    console.error('Invalid coordinates');
    return false;
  }

  const { error } = await supabase
    .from('profiles')
    .update({ address })
    .eq('id', userId);

  if (error) {
    console.error('Error updating address:', error);
    return false;
  }

  return true;
}

/**
 * Upload profile avatar to storage
 */
export async function uploadAvatar(
  supabase: SupabaseClientType,
  userId: string,
  file: File
): Promise<string | null> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    console.error('File must be an image');
    return null;
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    console.error('File size must be less than 5MB');
    return null;
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('profiles')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError);
    return null;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('profiles').getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Delete profile avatar from storage
 */
export async function deleteAvatar(
  supabase: SupabaseClientType,
  avatarUrl: string
): Promise<boolean> {
  // Extract file path from URL
  const urlParts = avatarUrl.split('/');
  const filePath = `avatars/${urlParts[urlParts.length - 1]}`;

  const { error } = await supabase.storage.from('profiles').remove([filePath]);

  if (error) {
    console.error('Error deleting avatar:', error);
    return false;
  }

  return true;
}

/**
 * Validate address format
 */
export function validateAddress(address: Address): boolean {
  if (
    !address.street ||
    !address.city ||
    !address.state ||
    !address.zip_code ||
    !address.coordinates
  ) {
    return false;
  }

  const { lat, lng } = address.coordinates;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }

  return true;
}
