import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable')
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
})

// Database types for TypeScript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          user_id: string
          hashed_student_key: string
          sso_provider: string | null
          created_at: string
        }
        Insert: {
          user_id?: string
          hashed_student_key: string
          sso_provider?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          hashed_student_key?: string
          sso_provider?: string | null
          created_at?: string
        }
      }
      courses: {
        Row: {
          course_id: string
          name: string
          term: string
          pepper: string
          created_at: string
        }
        Insert: {
          course_id?: string
          name: string
          term: string
          pepper: string
          created_at?: string
        }
        Update: {
          course_id?: string
          name?: string
          term?: string
          pepper?: string
          created_at?: string
        }
      }
      enrollments: {
        Row: {
          user_id: string
          course_id: string
          role: string
          created_at: string
        }
        Insert: {
          user_id: string
          course_id: string
          role?: string
          created_at?: string
        }
        Update: {
          user_id?: string
          course_id?: string
          role?: string
          created_at?: string
        }
      }
      instruments: {
        Row: {
          instrument_id: string
          name: string
          version: string
          status: string
          created_at: string
        }
        Insert: {
          instrument_id?: string
          name: string
          version: string
          status?: string
          created_at?: string
        }
        Update: {
          instrument_id?: string
          name?: string
          version?: string
          status?: string
          created_at?: string
        }
      }
      items: {
        Row: {
          item_id: string
          domain: string
          subdomain: string
          difficulty: number
          type: string
          stem: string
          options: any | null
          key: string | null
          rubric: any | null
          is_anchor: boolean
          created_at: string
        }
        Insert: {
          item_id?: string
          domain: string
          subdomain: string
          difficulty: number
          type: string
          stem: string
          options?: any | null
          key?: string | null
          rubric?: any | null
          is_anchor?: boolean
          created_at?: string
        }
        Update: {
          item_id?: string
          domain?: string
          subdomain?: string
          difficulty?: number
          type?: string
          stem?: string
          options?: any | null
          key?: string | null
          rubric?: any | null
          is_anchor?: boolean
          created_at?: string
        }
      }
      attempts: {
        Row: {
          attempt_id: string
          user_id: string
          course_id: string
          instrument_id: string
          attempt_type: string
          started_at: string
          submitted_at: string | null
          duration_s: number | null
          created_at: string
        }
        Insert: {
          attempt_id?: string
          user_id: string
          course_id: string
          instrument_id: string
          attempt_type: string
          started_at?: string
          submitted_at?: string | null
          duration_s?: number | null
          created_at?: string
        }
        Update: {
          attempt_id?: string
          user_id?: string
          course_id?: string
          instrument_id?: string
          attempt_type?: string
          started_at?: string
          submitted_at?: string | null
          duration_s?: number | null
          created_at?: string
        }
      }
      responses: {
        Row: {
          response_id: string
          attempt_id: string
          item_id: string
          raw_answer: any
          score: number | null
          confidence: number | null
          ai_confidence: number | null
          ai_flags: any | null
          created_at: string
        }
        Insert: {
          response_id?: string
          attempt_id: string
          item_id: string
          raw_answer: any
          score?: number | null
          confidence?: number | null
          ai_confidence?: number | null
          ai_flags?: any | null
          created_at?: string
        }
        Update: {
          response_id?: string
          attempt_id?: string
          item_id?: string
          raw_answer?: any
          score?: number | null
          confidence?: number | null
          ai_confidence?: number | null
          ai_flags?: any | null
          created_at?: string
        }
      }
      scores: {
        Row: {
          attempt_id: string
          overall: number
          by_domain: any
          se_overall: number
          overconfidence_index: number
          created_at: string
        }
        Insert: {
          attempt_id: string
          overall: number
          by_domain: any
          se_overall: number
          overconfidence_index: number
          created_at?: string
        }
        Update: {
          attempt_id?: string
          overall?: number
          by_domain?: any
          se_overall?: number
          overconfidence_index?: number
          created_at?: string
        }
      }
    }
  }
}