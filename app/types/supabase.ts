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
      user_profiles: {
        Row: {
          id: string
          role: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          created_at: string
          created_by: string | null
          is_active: boolean
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          created_by?: string | null
          is_active?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          created_by?: string | null
          is_active?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      entries: {
        Row: {
          id: string
          previous_version_id: string | null
          is_current_version: boolean
          entry_date: string
          customer_id: string
          ironing: number
          saree_ironing: number
          dry_cleaning: number
          correction_reason: string | null
          is_correction: boolean
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          previous_version_id?: string | null
          is_current_version?: boolean
          entry_date: string
          customer_id: string
          ironing?: number
          saree_ironing?: number
          dry_cleaning?: number
          correction_reason?: string | null
          is_correction?: boolean
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          previous_version_id?: string | null
          is_current_version?: boolean
          entry_date?: string
          customer_id?: string
          ironing?: number
          saree_ironing?: number
          dry_cleaning?: number
          correction_reason?: string | null
          is_correction?: boolean
          created_at?: string
          created_by?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}