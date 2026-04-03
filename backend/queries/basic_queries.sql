-- ============================================================
-- Basic SQL Queries — DDL & DML Demonstrations
-- Introduction to SQL concepts
-- ============================================================

-- ============================================================
-- DDL (Data Definition Language) Commands
-- ============================================================

-- 1. CREATE TABLE — Define a new table
-- (Already demonstrated in schema.sql, here's an additional example)
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id INTEGER,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    old_values JSONB,
    new_values JSONB
);

-- 2. ALTER TABLE — Modify an existing table structure
-- Add a column
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Modify a column type (example)
-- ALTER TABLE tests ALTER COLUMN title TYPE VARCHAR(500);

-- Add a constraint
-- ALTER TABLE questions ADD CONSTRAINT chk_question_length
--     CHECK (LENGTH(question_text) >= 10);

-- 3. DROP TABLE — Remove a table entirely
-- DROP TABLE IF EXISTS audit_log CASCADE;

-- 4. TRUNCATE — Remove all rows from a table (faster than DELETE)
-- TRUNCATE TABLE audit_log RESTART IDENTITY;


-- ============================================================
-- DML (Data Manipulation Language) Commands
-- ============================================================

-- 1. INSERT — Add new records

-- Insert a single subject
INSERT INTO subjects (name, description)
VALUES ('Artificial Intelligence', 'Covers search algorithms, ML basics, and neural networks')
ON CONFLICT (name) DO NOTHING;

-- Insert multiple records at once
INSERT INTO subjects (name, description) VALUES
    ('Discrete Mathematics', 'Covers logic, sets, relations, and graph theory'),
    ('Theory of Computation', 'Covers automata, regular languages, and Turing machines')
ON CONFLICT (name) DO NOTHING;


-- 2. SELECT — Retrieve data from tables

-- Select all users
SELECT * FROM users;

-- Select specific columns with alias
SELECT
    name AS student_name,
    email AS student_email,
    created_at AS registration_date
FROM users
WHERE role = 'student';

-- Select with conditions
SELECT * FROM questions
WHERE difficulty = 'hard'
  AND subject_id = 1;

-- Select with pattern matching
SELECT * FROM users
WHERE email LIKE '%@assessment.com';

-- Select with sorting
SELECT name, email, created_at
FROM users
ORDER BY created_at DESC;

-- Select with limit and offset (pagination)
SELECT * FROM questions
ORDER BY id
LIMIT 10 OFFSET 0;

-- Select distinct values
SELECT DISTINCT difficulty FROM questions;

-- Select with COUNT
SELECT COUNT(*) AS total_questions FROM questions;

-- Select with aggregate functions
SELECT
    subject_id,
    COUNT(*) AS question_count,
    MIN(created_at) AS first_question_date,
    MAX(created_at) AS last_question_date
FROM questions
GROUP BY subject_id;


-- 3. UPDATE — Modify existing records

-- Update a single record
UPDATE subjects
SET description = 'Updated description for DBMS course'
WHERE name = 'Database Management Systems';

-- Update multiple records
UPDATE questions
SET difficulty = 'medium'
WHERE difficulty = 'easy'
  AND subject_id = 1;

-- Update with subquery
UPDATE users
SET status = 'approved'
WHERE id IN (
    SELECT id FROM users
    WHERE role = 'student'
      AND created_at < NOW() - INTERVAL '7 days'
);


-- 4. DELETE — Remove records

-- Delete a specific record
DELETE FROM subjects
WHERE name = 'Artificial Intelligence';

-- Delete with condition
DELETE FROM questions
WHERE difficulty = 'easy'
  AND created_at < NOW() - INTERVAL '1 year';

-- Delete with subquery
DELETE FROM attempts
WHERE user_id IN (
    SELECT id FROM users WHERE status = 'rejected'
);
