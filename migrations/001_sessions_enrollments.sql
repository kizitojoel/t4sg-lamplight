-- Migration: Sessions and Enrollments
-- Run this in the Supabase SQL Editor
--
-- This works with existing tables:
-- - sessions (already exists with course_placement_id, quarter, year)
-- - assessments (already exists)
-- - assessment_results (already exists)

-- ============================================
-- STEP 1: Create enrollment status enum
-- ============================================

DO $$ BEGIN
    CREATE TYPE enrollment_status_enum AS ENUM ('enrolled', 'completed', 'dropped', 'withdrawn');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- STEP 2: Create session status enum
-- ============================================

DO $$ BEGIN
    CREATE TYPE session_status_enum AS ENUM ('upcoming', 'active', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- STEP 3: Enhance existing sessions table
-- ============================================

-- Add missing columns to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS status session_status_enum DEFAULT 'active';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add unique constraint if it doesn't exist
DO $$ BEGIN
    ALTER TABLE sessions ADD CONSTRAINT sessions_unique_course_quarter_year 
        UNIQUE (course_placement_id, quarter, year);
EXCEPTION
    WHEN duplicate_table THEN null;
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_course_placement ON sessions(course_placement_id);
CREATE INDEX IF NOT EXISTS idx_sessions_year_quarter ON sessions(year, quarter);

-- Enable RLS on sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for sessions
DROP POLICY IF EXISTS "Authenticated users can view sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can insert sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can update sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can delete sessions" ON sessions;

CREATE POLICY "Authenticated users can view sessions"
    ON sessions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can insert sessions"
    ON sessions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update sessions"
    ON sessions FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete sessions"
    ON sessions FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- STEP 4: Create enrollments table
-- ============================================

CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE RESTRICT,
    is_current BOOLEAN NOT NULL DEFAULT true,
    status enrollment_status_enum NOT NULL DEFAULT 'enrolled',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate enrollments in the same session
    UNIQUE (student_id, session_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_session ON enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_is_current ON enrollments(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Enable RLS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- RLS policies for enrollments
DROP POLICY IF EXISTS "Authenticated users can view enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can insert enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can update enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can delete enrollments" ON enrollments;

CREATE POLICY "Authenticated users can view enrollments"
    ON enrollments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can insert enrollments"
    ON enrollments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update enrollments"
    ON enrollments FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete enrollments"
    ON enrollments FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- STEP 5: Add enrollment_id to assessment_results
-- ============================================

-- Add enrollment_id column to link assessments to enrollments
ALTER TABLE assessment_results 
    ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assessment_results_enrollment ON assessment_results(enrollment_id);

-- ============================================
-- STEP 6: Create updated_at triggers
-- ============================================

-- Function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_enrollments_updated_at ON enrollments;
CREATE TRIGGER update_enrollments_updated_at
    BEFORE UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 7: Trigger to ensure only one current enrollment per student
-- ============================================

CREATE OR REPLACE FUNCTION ensure_single_current_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting is_current to true, set all other enrollments for this student to false
    IF NEW.is_current = true THEN
        UPDATE enrollments
        SET is_current = false, updated_at = NOW()
        WHERE student_id = NEW.student_id
          AND id != NEW.id
          AND is_current = true;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS ensure_single_current_enrollment_trigger ON enrollments;
CREATE TRIGGER ensure_single_current_enrollment_trigger
    BEFORE INSERT OR UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_current_enrollment();

-- ============================================
-- STEP 8: Migrate existing student data
-- ============================================

DO $$
DECLARE
    course_record RECORD;
    existing_session_id INTEGER;
BEGIN
    -- For each course_placement that has students enrolled
    FOR course_record IN 
        SELECT DISTINCT s.course_placement_id
        FROM students s
        WHERE s.course_placement_id IS NOT NULL
    LOOP
        -- Check if a session already exists for this course in Winter 2025
        SELECT id INTO existing_session_id
        FROM sessions
        WHERE course_placement_id = course_record.course_placement_id
          AND quarter = 'Winter'
          AND year = 2025;
        
        -- If no session exists, create one
        IF existing_session_id IS NULL THEN
            INSERT INTO sessions (course_placement_id, quarter, year, status)
            VALUES (course_record.course_placement_id, 'Winter', 2025, 'active')
            RETURNING id INTO existing_session_id;
        END IF;
        
        -- Create enrollment records for all students in this course
        INSERT INTO enrollments (student_id, session_id, is_current, status, enrolled_at)
        SELECT 
            s.id,
            existing_session_id,
            true,
            'enrolled',
            COALESCE(s.created_at, NOW())
        FROM students s
        WHERE s.course_placement_id = course_record.course_placement_id
        ON CONFLICT (student_id, session_id) DO NOTHING;
        
    END LOOP;
END $$;

-- ============================================
-- STEP 9: Create helper view for session display
-- ============================================

DROP VIEW IF EXISTS sessions_with_details;
CREATE VIEW sessions_with_details AS
SELECT 
    s.id,
    s.course_placement_id,
    cp.name as course_name,
    s.quarter,
    s.year,
    s.status,
    s.start_date,
    s.end_date,
    s.created_at,
    -- Display name: "ESOL Beginner L1 Part 1 - Winter 2025"
    cp.name || ' - ' || s.quarter || ' ' || s.year::text as display_name,
    -- Count of currently enrolled students
    (SELECT COUNT(*) FROM enrollments e WHERE e.session_id = s.id AND e.is_current = true AND e.status = 'enrolled') as enrolled_count,
    -- Count of all enrollments (including completed, dropped)
    (SELECT COUNT(*) FROM enrollments e WHERE e.session_id = s.id) as total_enrollment_count
FROM sessions s
JOIN course_placement cp ON cp.id = s.course_placement_id;

-- ============================================
-- COMPLETE!
-- ============================================

-- Summary:
-- 1. Enhanced sessions table with status, start_date, end_date, updated_at
-- 2. Created enrollments table linking students to sessions
-- 3. Added enrollment_id to existing assessment_results table
-- 4. Set up RLS policies
-- 5. Created triggers for updated_at and single current enrollment
-- 6. Migrated existing students to enrollment records
-- 7. Created sessions_with_details view

SELECT 'Migration completed successfully!' as status;
