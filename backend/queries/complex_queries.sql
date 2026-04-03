-- ============================================================
-- Complex SQL Queries
-- Demonstrates GROUP BY, HAVING, ORDER BY, JOINs,
-- Subqueries, WITH clause (CTEs)
-- ============================================================


-- ============================================================
-- 1. GROUP BY & HAVING
-- ============================================================

-- Average score per subject
SELECT
    s.name AS subject_name,
    COUNT(a.id) AS total_attempts,
    ROUND(AVG(a.score), 2) AS avg_score,
    ROUND(AVG(r.percentage), 2) AS avg_percentage
FROM subjects s
JOIN tests t ON s.id = t.subject_id
JOIN attempts a ON t.id = a.test_id
JOIN results r ON a.id = r.attempt_id
WHERE a.status = 'completed'
GROUP BY s.name
ORDER BY avg_percentage DESC;


-- Subjects with more than 5 test attempts
SELECT
    s.name AS subject_name,
    COUNT(a.id) AS attempt_count
FROM subjects s
JOIN tests t ON s.id = t.subject_id
JOIN attempts a ON t.id = a.test_id
GROUP BY s.name
HAVING COUNT(a.id) > 5
ORDER BY attempt_count DESC;


-- Number of attempts per test (only tests with at least 1 attempt)
SELECT
    t.id AS test_id,
    t.title AS test_title,
    COUNT(a.id) AS attempt_count,
    ROUND(AVG(r.percentage), 2) AS avg_score_percent
FROM tests t
JOIN attempts a ON t.id = a.test_id
LEFT JOIN results r ON a.id = r.attempt_id
GROUP BY t.id, t.title
HAVING COUNT(a.id) >= 1
ORDER BY attempt_count DESC;


-- Question difficulty distribution per subject
SELECT
    s.name AS subject,
    q.difficulty,
    COUNT(q.id) AS count
FROM subjects s
JOIN questions q ON s.id = q.subject_id
GROUP BY s.name, q.difficulty
ORDER BY s.name, q.difficulty;


-- ============================================================
-- 2. JOINs (INNER, LEFT, RIGHT, FULL OUTER)
-- ============================================================

-- INNER JOIN: Get all test attempts with student and test details
SELECT
    u.name AS student_name,
    t.title AS test_title,
    a.start_time,
    a.end_time,
    a.score,
    a.status
FROM attempts a
INNER JOIN users u ON a.user_id = u.id
INNER JOIN tests t ON a.test_id = t.id
ORDER BY a.start_time DESC;


-- LEFT JOIN: All students with their attempt count (including those with zero attempts)
SELECT
    u.name AS student_name,
    u.email,
    COUNT(a.id) AS total_attempts,
    COALESCE(ROUND(AVG(r.percentage), 2), 0) AS avg_percentage
FROM users u
LEFT JOIN attempts a ON u.id = a.user_id AND a.status = 'completed'
LEFT JOIN results r ON a.id = r.attempt_id
WHERE u.role = 'student' AND u.status = 'approved'
GROUP BY u.id, u.name, u.email
ORDER BY avg_percentage DESC;


-- FULL OUTER JOIN: All tests and all subjects (to find unmatched ones)
SELECT
    s.name AS subject_name,
    t.title AS test_title,
    t.is_published
FROM subjects s
FULL OUTER JOIN tests t ON s.id = t.subject_id
ORDER BY s.name;


-- Self JOIN: Students who attempted the same test
SELECT DISTINCT
    u1.name AS student_1,
    u2.name AS student_2,
    t.title AS common_test
FROM attempts a1
JOIN attempts a2 ON a1.test_id = a2.test_id AND a1.user_id < a2.user_id
JOIN users u1 ON a1.user_id = u1.id
JOIN users u2 ON a2.user_id = u2.id
JOIN tests t ON a1.test_id = t.id;


-- ============================================================
-- 3. Subqueries
-- ============================================================

-- Students with scores above the overall average
SELECT u.name, r.percentage
FROM users u
JOIN attempts a ON u.id = a.user_id
JOIN results r ON a.id = r.attempt_id
WHERE r.percentage > (
    SELECT AVG(percentage) FROM results
)
ORDER BY r.percentage DESC;


-- Tests that no student has attempted yet
SELECT t.id, t.title, s.name AS subject
FROM tests t
JOIN subjects s ON t.subject_id = s.id
WHERE t.id NOT IN (
    SELECT DISTINCT test_id FROM attempts
)
AND t.is_published = TRUE;


-- Top performing student per test (correlated subquery)
SELECT
    t.title AS test_title,
    u.name AS top_student,
    r.percentage AS best_score
FROM results r
JOIN attempts a ON r.attempt_id = a.id
JOIN users u ON a.user_id = u.id
JOIN tests t ON a.test_id = t.id
WHERE r.percentage = (
    SELECT MAX(r2.percentage)
    FROM results r2
    JOIN attempts a2 ON r2.attempt_id = a2.id
    WHERE a2.test_id = a.test_id
);


-- Find students who scored highest in the most subjects
SELECT u.name, COUNT(DISTINCT t.subject_id) AS top_in_subjects
FROM users u
JOIN attempts a ON u.id = a.user_id
JOIN tests t ON a.test_id = t.id
JOIN results r ON a.id = r.attempt_id
WHERE r.percentage = (
    SELECT MAX(r2.percentage)
    FROM results r2
    JOIN attempts a2 ON r2.attempt_id = a2.id
    JOIN tests t2 ON a2.test_id = t2.id
    WHERE t2.subject_id = t.subject_id
)
GROUP BY u.name
ORDER BY top_in_subjects DESC;


-- ============================================================
-- 4. WITH clause (Common Table Expressions / CTEs)
-- ============================================================

-- Comprehensive student performance summary using CTE
WITH student_scores AS (
    SELECT
        u.id AS user_id,
        u.name AS student_name,
        s.name AS subject_name,
        r.percentage,
        r.correct_answers,
        r.total_questions,
        ROW_NUMBER() OVER (PARTITION BY u.id, s.name ORDER BY r.percentage DESC) AS rank_in_subject
    FROM users u
    JOIN attempts a ON u.id = a.user_id
    JOIN tests t ON a.test_id = t.id
    JOIN subjects s ON t.subject_id = s.id
    JOIN results r ON a.id = r.attempt_id
    WHERE a.status = 'completed'
),
subject_averages AS (
    SELECT
        subject_name,
        ROUND(AVG(percentage), 2) AS avg_percentage
    FROM student_scores
    GROUP BY subject_name
)
SELECT
    ss.student_name,
    ss.subject_name,
    ss.percentage AS best_score,
    sa.avg_percentage AS class_average,
    CASE
        WHEN ss.percentage >= sa.avg_percentage THEN 'Above Average'
        ELSE 'Below Average'
    END AS performance_status
FROM student_scores ss
JOIN subject_averages sa ON ss.subject_name = sa.subject_name
WHERE ss.rank_in_subject = 1
ORDER BY ss.student_name, ss.subject_name;


-- Recursive CTE: Find question usage chain
-- (questions used in tests, and those tests' attempt counts)
WITH question_usage AS (
    SELECT
        q.id AS question_id,
        q.question_text,
        q.difficulty,
        s.name AS subject_name,
        COUNT(DISTINCT tq.test_id) AS used_in_tests,
        COUNT(DISTINCT r.id) AS total_responses
    FROM questions q
    JOIN subjects s ON q.subject_id = s.id
    LEFT JOIN test_questions tq ON q.id = tq.question_id
    LEFT JOIN responses r ON q.id = r.question_id
    GROUP BY q.id, q.question_text, q.difficulty, s.name
),
response_accuracy AS (
    SELECT
        q.id AS question_id,
        COUNT(r.id) AS total_responses,
        COUNT(CASE WHEN o.is_correct THEN 1 END) AS correct_responses,
        ROUND(
            COUNT(CASE WHEN o.is_correct THEN 1 END)::NUMERIC /
            NULLIF(COUNT(r.id), 0) * 100, 2
        ) AS accuracy_rate
    FROM questions q
    LEFT JOIN responses r ON q.id = r.question_id
    LEFT JOIN options o ON r.selected_option = o.id
    GROUP BY q.id
)
SELECT
    qu.question_text,
    qu.difficulty,
    qu.subject_name,
    qu.used_in_tests,
    qu.total_responses,
    COALESCE(ra.accuracy_rate, 0) AS accuracy_percentage
FROM question_usage qu
LEFT JOIN response_accuracy ra ON qu.question_id = ra.question_id
ORDER BY qu.total_responses DESC, qu.used_in_tests DESC;


-- Find students with highest scores (grouped by user)
SELECT user_id, MAX(score) AS highest_score
FROM attempts
WHERE status = 'completed'
GROUP BY user_id
ORDER BY highest_score DESC;
