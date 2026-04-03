-- ============================================================
-- Intermediate SQL Queries
-- Demonstrates UNION, INTERSECT, EXCEPT, and VIEWs
-- ============================================================

-- ============================================================
-- SET OPERATIONS
-- ============================================================

-- 1. UNION — Combine students who attempted Test 1 OR Test 2
-- UNION removes duplicates automatically
SELECT u.id, u.name, u.email
FROM users u
JOIN attempts a ON u.id = a.user_id
WHERE a.test_id = 1

UNION

SELECT u.id, u.name, u.email
FROM users u
JOIN attempts a ON u.id = a.user_id
WHERE a.test_id = 2;


-- UNION ALL — Same as UNION but keeps duplicates
SELECT u.name, 'Test 1' AS test_attempted
FROM users u
JOIN attempts a ON u.id = a.user_id
WHERE a.test_id = 1

UNION ALL

SELECT u.name, 'Test 2' AS test_attempted
FROM users u
JOIN attempts a ON u.id = a.user_id
WHERE a.test_id = 2;


-- 2. INTERSECT — Students who attempted BOTH Test 1 AND Test 2
SELECT u.id, u.name, u.email
FROM users u
JOIN attempts a ON u.id = a.user_id
WHERE a.test_id = 1

INTERSECT

SELECT u.id, u.name, u.email
FROM users u
JOIN attempts a ON u.id = a.user_id
WHERE a.test_id = 2;


-- 3. EXCEPT — Students who attempted Test 1 but NOT Test 2
SELECT u.id, u.name, u.email
FROM users u
JOIN attempts a ON u.id = a.user_id
WHERE a.test_id = 1

EXCEPT

SELECT u.id, u.name, u.email
FROM users u
JOIN attempts a ON u.id = a.user_id
WHERE a.test_id = 2;


-- ============================================================
-- VIEWS
-- ============================================================

-- 1. View: All completed test attempts with scores
CREATE OR REPLACE VIEW completed_tests_view AS
SELECT
    a.id AS attempt_id,
    u.name AS student_name,
    u.email AS student_email,
    t.title AS test_title,
    s.name AS subject_name,
    a.start_time,
    a.end_time,
    a.score,
    r.total_questions,
    r.correct_answers,
    r.percentage,
    EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 60.0 AS time_taken_minutes
FROM attempts a
JOIN users u ON a.user_id = u.id
JOIN tests t ON a.test_id = t.id
JOIN subjects s ON t.subject_id = s.id
LEFT JOIN results r ON a.id = r.attempt_id
WHERE a.status = 'completed';


-- 2. View: Question bank summary by subject and difficulty
CREATE OR REPLACE VIEW question_bank_summary AS
SELECT
    s.name AS subject_name,
    q.difficulty,
    COUNT(*) AS question_count
FROM questions q
JOIN subjects s ON q.subject_id = s.id
GROUP BY s.name, q.difficulty
ORDER BY s.name, q.difficulty;


-- 3. View: Test overview with question counts
CREATE OR REPLACE VIEW test_overview AS
SELECT
    t.id AS test_id,
    t.title,
    s.name AS subject_name,
    t.duration AS duration_minutes,
    u.name AS created_by_name,
    t.is_published,
    COUNT(tq.id) AS total_questions,
    t.created_at
FROM tests t
JOIN subjects s ON t.subject_id = s.id
JOIN users u ON t.created_by = u.id
LEFT JOIN test_questions tq ON t.id = tq.test_id
GROUP BY t.id, t.title, s.name, t.duration, u.name, t.is_published, t.created_at
ORDER BY t.created_at DESC;


-- 4. View: Student performance summary
CREATE OR REPLACE VIEW student_performance_summary AS
SELECT
    u.id AS user_id,
    u.name AS student_name,
    COUNT(DISTINCT a.id) AS total_attempts,
    COUNT(DISTINCT a.test_id) AS tests_taken,
    ROUND(AVG(r.percentage), 2) AS average_percentage,
    MAX(r.percentage) AS best_percentage,
    MIN(r.percentage) AS worst_percentage,
    SUM(r.correct_answers) AS total_correct,
    SUM(r.total_questions) AS total_questions_attempted
FROM users u
LEFT JOIN attempts a ON u.id = a.user_id AND a.status = 'completed'
LEFT JOIN results r ON a.id = r.attempt_id
WHERE u.role = 'student'
GROUP BY u.id, u.name;


-- 5. View: Active tests available for students
CREATE OR REPLACE VIEW available_tests AS
SELECT
    t.id AS test_id,
    t.title,
    s.name AS subject_name,
    t.duration AS duration_minutes,
    u.name AS instructor_name,
    COUNT(tq.id) AS total_questions,
    t.created_at
FROM tests t
JOIN subjects s ON t.subject_id = s.id
JOIN users u ON t.created_by = u.id
LEFT JOIN test_questions tq ON t.id = tq.test_id
WHERE t.is_published = TRUE
GROUP BY t.id, t.title, s.name, t.duration, u.name, t.created_at
HAVING COUNT(tq.id) > 0
ORDER BY t.created_at DESC;
