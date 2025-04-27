import { supabase } from '../supabase';
import { Database } from '../../types/supabase';
import { handleApiError } from '../../utils/errorHandler';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

/**
 * Get user by ID
 * @param userId User ID
 * @returns User data or null
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error, 'Failed to get user');
    return null;
  }
};

/**
 * Update user profile
 * @param userId User ID
 * @param userData User data to update
 * @returns Updated user data or null
 */
export const updateUserProfile = async (
  userId: string,
  userData: UserUpdate
): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error, 'Failed to update user profile');
    return null;
  }
};

/**
 * Get user role (DM or player)
 * @param userId User ID
 * @returns User role or null
 */
export const getUserRole = async (userId: string): Promise<'DM' | 'player' | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.role || null;
  } catch (error) {
    handleApiError(error, 'Failed to get user role');
    return null;
  }
};
