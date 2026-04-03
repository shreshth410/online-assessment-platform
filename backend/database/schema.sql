-- ============================================================
-- Online Assessment & Evaluation Platform
-- Database Schema (PostgreSQL / Supabase)
-- All tables in Third Normal Form (3NF)
-- ============================================================

-- ============================================================
-- DDL: CREATE TABLE statements with integrity constraints
-- ============================================================

-- 1. Users table
-- Linked to Supabase auth.users via id (UUID)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- 3. Questions table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_text TEXT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Options table (each question has exactly 4 options)
CREATE TABLE IF NOT EXISTS options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE
);

-- 5. Tests table
CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    duration INTEGER NOT NULL CHECK (duration > 0),  -- duration in minutes
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Test Questions junction table (M:N between tests and questions)
CREATE TABLE IF NOT EXISTS test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    UNIQUE(test_id, question_id)
);

-- 7. Attempts table
CREATE TABLE IF NOT EXISTS attempts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE RESTRICT,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    score INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'timed_out'))
);

-- 8. Responses table (one per question per attempt)
CREATE TABLE IF NOT EXISTS responses (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    selected_option INTEGER REFERENCES options(id) ON DELETE SET NULL,
    UNIQUE(attempt_id, question_id)
);

-- 9. Results table (one per attempt, auto-generated)
CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER NOT NULL UNIQUE REFERENCES attempts(id) ON DELETE CASCADE,
    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    score INTEGER NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00
);


-- ============================================================
-- INDEXES for performance optimization
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_options_question_id ON options(question_id);
CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_questions_question_id ON test_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_test_id ON attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_responses_attempt_id ON responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON responses(question_id);
CREATE INDEX IF NOT EXISTS idx_results_attempt_id ON results(attempt_id);


-- ============================================================
-- ROW LEVEL SECURITY (RLS) policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get current user's status
CREATE OR REPLACE FUNCTION get_user_status()
RETURNS TEXT AS $$
    SELECT status FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- USERS policies ----
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (get_user_role() = 'admin');

CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update any user"
    ON users FOR UPDATE
    USING (get_user_role() = 'admin');

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

-- ---- SUBJECTS policies ----
CREATE POLICY "Anyone can view subjects"
    ON subjects FOR SELECT
    USING (true);

CREATE POLICY "Admins and instructors can manage subjects"
    ON subjects FOR ALL
    USING (get_user_role() IN ('admin', 'instructor'));

-- ---- QUESTIONS policies ----
CREATE POLICY "Approved users can view questions"
    ON questions FOR SELECT
    USING (get_user_status() = 'approved');

CREATE POLICY "Instructors and admins can manage questions"
    ON questions FOR ALL
    USING (get_user_role() IN ('admin', 'instructor'));

-- ---- OPTIONS policies ----
CREATE POLICY "Approved users can view options"
    ON options FOR SELECT
    USING (get_user_status() = 'approved');

CREATE POLICY "Instructors and admins can manage options"
    ON options FOR ALL
    USING (get_user_role() IN ('admin', 'instructor'));

-- ---- TESTS policies ----
CREATE POLICY "Approved users can view published tests"
    ON tests FOR SELECT
    USING (is_published = TRUE AND get_user_status() = 'approved');

CREATE POLICY "Instructors can view own tests"
    ON tests FOR SELECT
    USING (created_by = auth.uid());

CREATE POLICY "Admins can view all tests"
    ON tests FOR SELECT
    USING (get_user_role() = 'admin');

CREATE POLICY "Instructors and admins can manage tests"
    ON tests FOR ALL
    USING (get_user_role() IN ('admin', 'instructor'));

-- ---- TEST_QUESTIONS policies ----
CREATE POLICY "Approved users can view test questions"
    ON test_questions FOR SELECT
    USING (get_user_status() = 'approved');

CREATE POLICY "Instructors and admins can manage test questions"
    ON test_questions FOR ALL
    USING (get_user_role() IN ('admin', 'instructor'));

-- ---- ATTEMPTS policies ----
CREATE POLICY "Students can view own attempts"
    ON attempts FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Students can create attempts"
    ON attempts FOR INSERT
    WITH CHECK (user_id = auth.uid() AND get_user_role() = 'student');

CREATE POLICY "Students can update own attempts"
    ON attempts FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Instructors can view attempts for their tests"
    ON attempts FOR SELECT
    USING (test_id IN (SELECT id FROM tests WHERE created_by = auth.uid()));

CREATE POLICY "Admins can view all attempts"
    ON attempts FOR SELECT
    USING (get_user_role() = 'admin');

-- ---- RESPONSES policies ----
CREATE POLICY "Students can view own responses"
    ON responses FOR SELECT
    USING (attempt_id IN (SELECT id FROM attempts WHERE user_id = auth.uid()));

CREATE POLICY "Students can insert responses"
    ON responses FOR INSERT
    WITH CHECK (attempt_id IN (SELECT id FROM attempts WHERE user_id = auth.uid()));

CREATE POLICY "Instructors can view responses for their tests"
    ON responses FOR SELECT
    USING (attempt_id IN (
        SELECT a.id FROM attempts a
        JOIN tests t ON a.test_id = t.id
        WHERE t.created_by = auth.uid()
    ));

CREATE POLICY "Admins can view all responses"
    ON responses FOR SELECT
    USING (get_user_role() = 'admin');

-- ---- RESULTS policies ----
CREATE POLICY "Students can view own results"
    ON results FOR SELECT
    USING (attempt_id IN (SELECT id FROM attempts WHERE user_id = auth.uid()));

CREATE POLICY "Instructors can view results for their tests"
    ON results FOR SELECT
    USING (attempt_id IN (
        SELECT a.id FROM attempts a
        JOIN tests t ON a.test_id = t.id
        WHERE t.created_by = auth.uid()
    ));

CREATE POLICY "Admins can view all results"
    ON results FOR SELECT
    USING (get_user_role() = 'admin');

-- Allow service role to manage results (for triggers/functions)
CREATE POLICY "Service role can manage results"
    ON results FOR ALL
    USING (true)
    WITH CHECK (true);
