import { useEffect, useState } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

type SupabaseEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';
type SupabaseTable = 'users' | 'campaigns' | 'characters' | 'maps' | 'chat_messages' | 'turns' | 'dice_rolls';
type SubscriptionCallback<T> = (payload: RealtimePostgresChangesPayload<T>) => void;

interface SubscriptionFilter {
  event?: SupabaseEvent;
  schema?: string;
  table: SupabaseTable;
  filter?: string;
}

/**
 * Custom hook for Supabase realtime subscriptions
 * @param channelName Unique channel name
 * @param filters Array of subscription filters
 * @param callback Callback function to handle changes
 * @returns Subscription status
 */
export const useSupabaseSubscription = <T = any>(
  channelName: string,
  filters: SubscriptionFilter[],
  callback: SubscriptionCallback<T>
): boolean => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      // Create channel
      channel = supabase.channel(channelName);

      // Add filters
      filters.forEach((filter) => {
        channel = channel.on(
          'postgres_changes',
          {
            event: filter.event || '*',
            schema: filter.schema || 'public',
            table: filter.table,
            filter: filter.filter,
          },
          (payload: RealtimePostgresChangesPayload<T>) => {
            callback(payload);
          }
        );
      });

      // Subscribe to channel
      const subscription = await channel.subscribe((status) => {
        setIsSubscribed(status === 'SUBSCRIBED');
      });

      return subscription;
    };

    setupSubscription();

    // Cleanup subscription
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      setIsSubscribed(false);
    };
  }, [channelName, callback]);

  return isSubscribed;
};

/**
 * Custom hook for subscribing to a specific table
 * @param table Table name
 * @param filter Optional filter string
 * @param callback Callback function to handle changes
 * @returns Subscription status
 */
export const useTableSubscription = <T = any>(
  table: SupabaseTable,
  callback: SubscriptionCallback<T>,
  filter?: string
): boolean => {
  return useSupabaseSubscription<T>(
    `table_${table}_${filter || 'all'}`,
    [{ table, filter }],
    callback
  );
};

/**
 * Custom hook for subscribing to a specific campaign's data
 * @param campaignId Campaign ID
 * @param tables Array of tables to subscribe to
 * @param callback Callback function to handle changes
 * @returns Subscription status
 */
export const useCampaignSubscription = <T = any>(
  campaignId: string,
  tables: SupabaseTable[],
  callback: SubscriptionCallback<T>
): boolean => {
  return useSupabaseSubscription<T>(
    `campaign_${campaignId}`,
    tables.map((table) => ({
      table,
      filter: `campaign_id=eq.${campaignId}`,
    })),
    callback
  );
};
