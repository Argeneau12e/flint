import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for account management
export async function createUserRecord(
  walletAddress: string,
  username: string,
  email?: string
) {
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        wallet_address: walletAddress,
        username: username.toLowerCase(), // Store lowercase for consistency
        email: email || null,
        display_name: username, // Default display name = username
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserByUsername(username: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*, reputation(*), settings(*)')
    .eq('username', username.toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

export async function getUserByWallet(walletAddress: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*, reputation(*), settings(*)')
    .eq('wallet_address', walletAddress)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('username', username.toLowerCase())
    .single();

  if (error && error.code === 'PGRST116') {
    // Not found = username is available
    return true;
  }

  if (error) throw error;
  return !data; // If data exists, username is taken
}

export async function updateUserSettings(
  userId: string,
  settings: {
    auto_release_enabled?: boolean;
    auto_release_threshold?: number;
    email_notifications?: boolean;
  }
) {
  // Check if settings row exists
  const { data: existingSettings } = await supabase
    .from('settings')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existingSettings) {
    // Update existing
    const { data, error } = await supabase
      .from('settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('settings')
      .insert([
        {
          user_id: userId,
          auto_release_enabled: false,
          auto_release_threshold: 90,
          email_notifications: true,
          ...settings,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function updateUserReputation(
  userId: string,
  updates: {
    points?: number;
    badge_tier?: string;
    completed_as_seller?: number;
    completed_as_buyer?: number;
    disputes_lost?: number;
  }
) {
  // Check if reputation row exists
  const { data: existingRep } = await supabase
    .from('reputation')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existingRep) {
    // Update existing
    const { data, error } = await supabase
      .from('reputation')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('reputation')
      .insert([
        {
          user_id: userId,
          points: 0,
          badge_tier: 'gray',
          completed_as_seller: 0,
          completed_as_buyer: 0,
          disputes_lost: 0,
          ...updates,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
