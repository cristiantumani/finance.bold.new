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
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category: string
          description: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category: string
          description: string
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'income' | 'expense'
          category?: string
          description?: string
          date?: string
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category: string
          limit: number
          spent: number
          period: 'monthly' | 'weekly' | 'yearly'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          limit: number
          spent: number
          period: 'monthly' | 'weekly' | 'yearly'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          limit?: number
          spent?: number
          period?: 'monthly' | 'weekly' | 'yearly'
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