import { Pool, QueryResult, QueryConfig, QueryResultRow } from 'pg';

// Database connection configuration
const databaseUrl = process.env.DATABASE_URL || '';

if (!databaseUrl) {
  console.warn('DATABASE_URL environment variable is not set. Database operations will fail.');
}

// Create connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

// Handle pool errors
// Note: Pool errors on idle connections are common and should not crash the application
// These can occur due to network issues, database restarts, or connection timeouts
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  // Log the error but don't crash - the pool will handle reconnection automatically
  // Only exit if this is a critical configuration error
  if (err.message && err.message.includes('connectionString')) {
    console.error('Fatal: Database connection string is invalid');
    process.exit(1);
  }
});

/**
 * Execute a SQL query
 */
export async function query<T extends QueryResultRow = any>(
  text: string | QueryConfig,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: typeof text === 'string' ? text.substring(0, 100) : 'prepared', duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error', { text: typeof text === 'string' ? text.substring(0, 100) : 'prepared', error });
    throw error;
  }
}

/**
 * Get a single row from a query
 */
export async function queryOne<T extends QueryResultRow = any>(
  text: string | QueryConfig,
  params?: any[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

/**
 * Get multiple rows from a query
 */
export async function queryMany<T extends QueryResultRow = any>(
  text: string | QueryConfig,
  params?: any[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the connection pool (for cleanup)
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

// Database types for TypeScript (matching the schema)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          user_id: string;
          hashed_student_key: string;
          hashed_password: string | null;
          sso_provider: string | null;
          created_at: string;
        };
        Insert: {
          user_id?: string;
          hashed_student_key: string;
          hashed_password?: string | null;
          sso_provider?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          hashed_student_key?: string;
          hashed_password?: string | null;
          sso_provider?: string | null;
          created_at?: string;
        };
      };
      courses: {
        Row: {
          course_id: string;
          name: string;
          term: string;
          pepper: string;
          created_at: string;
        };
        Insert: {
          course_id?: string;
          name: string;
          term: string;
          pepper: string;
          created_at?: string;
        };
        Update: {
          course_id?: string;
          name?: string;
          term?: string;
          pepper?: string;
          created_at?: string;
        };
      };
      enrollments: {
        Row: {
          user_id: string;
          course_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          course_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          course_id?: string;
          role?: string;
          created_at?: string;
        };
      };
      instruments: {
        Row: {
          instrument_id: string;
          name: string;
          version: string;
          status: string;
          created_at: string;
        };
        Insert: {
          instrument_id?: string;
          name: string;
          version: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          instrument_id?: string;
          name?: string;
          version?: string;
          status?: string;
          created_at?: string;
        };
      };
      items: {
        Row: {
          item_id: string;
          domain: string;
          subdomain: string;
          difficulty: number;
          type: string;
          stem: string;
          options: any | null;
          key: string | null;
          rubric: any | null;
          is_anchor: boolean;
          created_at: string;
        };
        Insert: {
          item_id?: string;
          domain: string;
          subdomain: string;
          difficulty: number;
          type: string;
          stem: string;
          options?: any | null;
          key?: string | null;
          rubric?: any | null;
          is_anchor?: boolean;
          created_at?: string;
        };
        Update: {
          item_id?: string;
          domain?: string;
          subdomain?: string;
          difficulty?: number;
          type?: string;
          stem?: string;
          options?: any | null;
          key?: string | null;
          rubric?: any | null;
          is_anchor?: boolean;
          created_at?: string;
        };
      };
      attempts: {
        Row: {
          attempt_id: string;
          user_id: string;
          course_id: string;
          instrument_id: string;
          attempt_type: string;
          started_at: string;
          submitted_at: string | null;
          duration_s: number | null;
          created_at: string;
        };
        Insert: {
          attempt_id?: string;
          user_id: string;
          course_id: string;
          instrument_id: string;
          attempt_type: string;
          started_at?: string;
          submitted_at?: string | null;
          duration_s?: number | null;
          created_at?: string;
        };
        Update: {
          attempt_id?: string;
          user_id?: string;
          course_id?: string;
          instrument_id?: string;
          attempt_type?: string;
          started_at?: string;
          submitted_at?: string | null;
          duration_s?: number | null;
          created_at?: string;
        };
      };
      responses: {
        Row: {
          response_id: string;
          attempt_id: string;
          item_id: string;
          raw_answer: any;
          score: number | null;
          confidence: number | null;
          ai_confidence: number | null;
          ai_flags: any | null;
          created_at: string;
        };
        Insert: {
          response_id?: string;
          attempt_id: string;
          item_id: string;
          raw_answer: any;
          score?: number | null;
          confidence?: number | null;
          ai_confidence?: number | null;
          ai_flags?: any | null;
          created_at?: string;
        };
        Update: {
          response_id?: string;
          attempt_id?: string;
          item_id?: string;
          raw_answer?: any;
          score?: number | null;
          confidence?: number | null;
          ai_confidence?: number | null;
          ai_flags?: any | null;
          created_at?: string;
        };
      };
      scores: {
        Row: {
          attempt_id: string;
          overall: number;
          by_domain: any;
          se_overall: number;
          overconfidence_index: number;
          created_at: string;
        };
        Insert: {
          attempt_id: string;
          overall: number;
          by_domain: any;
          se_overall: number;
          overconfidence_index: number;
          created_at?: string;
        };
        Update: {
          attempt_id?: string;
          overall?: number;
          by_domain?: any;
          se_overall?: number;
          overconfidence_index?: number;
          created_at?: string;
        };
      };
      student_profiles: {
        Row: {
          profile_id: string;
          user_id: string;
          course_id: string;
          // Baseline Demographic Characteristics (B1-B5)
          gender: string | null; // B1
          race_ethnicity: string | null; // B2
          age_range: string | null; // B3
          first_language: string | null; // B4
          first_language_other: string | null; // B4: Other specification
          work_experience: string | null; // B5
          // Baseline Financial Background & Context (B6-B8)
          prior_financial_products: any | null; // B6: JSONB array
          self_rated_financial_knowledge: string | null; // B7
          financial_stress_frequency: string | null; // B8
          // Additional Socio-economic data (Optional)
          household_income: string | null;
          parental_education: string | null;
          first_generation_college: boolean | null;
          financial_aid_recipient: boolean | null;
          has_student_loan_debt: boolean | null;
          student_loan_interest_rate: string | null;
          living_situation: string | null;
          work_study: boolean | null;
          email: string | null; // Optional email for password recovery
          completed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          profile_id?: string;
          user_id: string;
          course_id: string;
          // Baseline Demographic Characteristics (B1-B5)
          gender?: string | null; // B1
          race_ethnicity?: string | null; // B2
          age_range?: string | null; // B3
          first_language?: string | null; // B4
          first_language_other?: string | null; // B4: Other specification
          work_experience?: string | null; // B5
          // Baseline Financial Background & Context (B6-B8)
          prior_financial_products?: any | null; // B6: JSONB array
          self_rated_financial_knowledge?: string | null; // B7
          financial_stress_frequency?: string | null; // B8
          // Additional Socio-economic data (Optional)
          household_income?: string | null;
          parental_education?: string | null;
          first_generation_college?: boolean | null;
          financial_aid_recipient?: boolean | null;
          has_student_loan_debt?: boolean | null;
          student_loan_interest_rate?: string | null;
          living_situation?: string | null;
          work_study?: boolean | null;
          email?: string | null; // Optional email for password recovery
          completed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          profile_id?: string;
          user_id?: string;
          course_id?: string;
          // Baseline Demographic Characteristics (B1-B5)
          gender?: string | null; // B1
          race_ethnicity?: string | null; // B2
          age_range?: string | null; // B3
          first_language?: string | null; // B4
          first_language_other?: string | null; // B4: Other specification
          work_experience?: string | null; // B5
          // Baseline Financial Background & Context (B6-B8)
          prior_financial_products?: any | null; // B6: JSONB array
          self_rated_financial_knowledge?: string | null; // B7
          financial_stress_frequency?: string | null; // B8
          // Additional Socio-economic data (Optional)
          household_income?: string | null;
          parental_education?: string | null;
          first_generation_college?: boolean | null;
          financial_aid_recipient?: boolean | null;
          has_student_loan_debt?: boolean | null;
          student_loan_interest_rate?: string | null;
          living_situation?: string | null;
          work_study?: boolean | null;
          email?: string | null; // Optional email for password recovery
          completed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      password_reset_tokens: {
        Row: {
          token_id: string;
          user_id: string;
          course_id: string;
          token: string;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          token_id?: string;
          user_id: string;
          course_id: string;
          token: string;
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          token_id?: string;
          user_id?: string;
          course_id?: string;
          token?: string;
          expires_at?: string;
          used_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
};

// Export the pool for advanced usage if needed
export { pool };

// Default export for convenience
export default {
  query,
  queryOne,
  queryMany,
  transaction,
  closePool,
};



