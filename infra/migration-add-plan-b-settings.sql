-- Migration: Add plan_b_settings table for Google Forms fallback
-- Run this migration against the production database

CREATE TABLE IF NOT EXISTS plan_b_settings (
  setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  active_level TEXT CHECK (active_level IN ('full', 'assessment_only', 'minimal')),
  url_full TEXT,
  url_assessment_only TEXT,
  url_minimal TEXT,
  updated_by UUID REFERENCES instructors(instructor_id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_b_settings_course_id ON plan_b_settings(course_id);
