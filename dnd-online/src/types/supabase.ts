export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'DM' | 'player'
          last_login: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role: 'DM' | 'player'
          last_login?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'DM' | 'player'
          last_login?: string | null
          created_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          dm_id: string
          name: string
          status: 'active' | 'inactive' | 'archived'
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          dm_id: string
          name: string
          status?: 'active' | 'inactive' | 'archived'
          invite_code: string
          created_at?: string
        }
        Update: {
          id?: string
          dm_id?: string
          name?: string
          status?: 'active' | 'inactive' | 'archived'
          invite_code?: string
          created_at?: string
        }
      }
      characters: {
        Row: {
          id: string
          campaign_id: string
          player_id: string
          stats: Json
          class: string
          race: string
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          player_id: string
          stats: Json
          class: string
          race: string
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          player_id?: string
          stats?: Json
          class?: string
          race?: string
          created_at?: string
        }
      }
      maps: {
        Row: {
          id: string
          campaign_id: string
          map_image_url: string
          fog_of_war_grid: Json
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          map_image_url: string
          fog_of_war_grid: Json
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          map_image_url?: string
          fog_of_war_grid?: Json
          created_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          campaign_id: string
          sender_id: string
          type: 'OOC' | 'IC' | 'system'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          sender_id: string
          type: 'OOC' | 'IC' | 'system'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          sender_id?: string
          type?: 'OOC' | 'IC' | 'system'
          content?: string
          created_at?: string
        }
      }
      turns: {
        Row: {
          id: string
          campaign_id: string
          player_id: string
          turn_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          player_id: string
          turn_order: number
          is_active: boolean
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          player_id?: string
          turn_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      dice_rolls: {
        Row: {
          id: string
          campaign_id: string
          player_id: string
          roll_type: string
          result: number
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          player_id: string
          roll_type: string
          result: number
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          player_id?: string
          roll_type?: string
          result?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
