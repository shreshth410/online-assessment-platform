-- ============================================================
-- PostgreSQL Functions (PL/pgSQL)
-- Demonstrates database functions for business logic
-- ============================================================


-- ============================================================
-- 1. calculate_test_score(p_attempt_id)
-- Calculates the score for a given attempt by comparing
-- selected options with correct options using a CURSOR.
-- Updates or inserts into the results table.
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_test_score(p_attempt_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_total_questions INTEGER := 0;
    v_correct_answers INTEGER := 0;
    v_score INTEGER := 0;
    v_percentage NUMERIC(5,2) := 0.00;
    v_question_id INTEGER;
    v_selected_option INTEGER;
    v_is_correct BOOLEAN;
    -- CURSOR: iterate through all responses for this attempt
    response_cursor CURSOR FOR
        SELECT r.question_id, r.selected_option
        FROM responses r
        WHERE r.attempt_id = p_attempt_id;
BEGIN
    -- Count total questions in the test for this attempt
    SELECT COUNT(tq.id) INTO v_total_questions
    FROM test_questions tq
    JOIN attempts a ON a.test_id = tq.test_id
    WHERE a.id = p_attempt_id;

    -- Open cursor and iterate through each response
    OPEN response_cursor;
    LOOP
        FETCH response_cursor INTO v_question_id, v_selected_option;
        EXIT WHEN NOT FOUND;

        -- Check if the selected option is correct
        IF v_selected_option IS NOT NULL THEN
            SELECT o.is_correct INTO v_is_correct
            FROM options o
            WHERE o.id = v_selected_option;

            IF v_is_correct = TRUE THEN
                v_correct_answers := v_correct_answers + 1;
            END IF;
        END IF;
    END LOOP;
    CLOSE response_cursor;

    -- Calculate score and percentage
    v_score := v_correct_answers;
    IF v_total_questions > 0 THEN
        v_percentage := ROUND((v_correct_answers::NUMERIC / v_total_questions) * 100, 2);
    END IF;

    -- Upsert result (insert or update)
    INSERT INTO results (attempt_id, total_questions, correct_answers, score, percentage)
    VALUES (p_attempt_id, v_total_questions, v_correct_answers, v_score, v_percentage)
    ON CONFLICT (attempt_id)
    DO UPDATE SET
        total_questions = EXCLUDED.total_questions,
        correct_answers = EXCLUDED.correct_answers,
        score = EXCLUDED.score,
        percentage = EXCLUDED.percentage;

    -- Update the attempt's score
    UPDATE attempts
    SET score = v_score
    WHERE id = p_attempt_id;

    RAISE NOTICE 'Score calculated for attempt %: %/% (%.2f%%)',
        p_attempt_id, v_correct_answers, v_total_questions, v_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 2. get_student_statistics(p_user_id)
-- Returns comprehensive statistics for a given student
-- as a JSON object.
-- ============================================================
CREATE OR REPLACE FUNCTION get_student_statistics(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'user_id', p_user_id,
        'total_tests_taken', COUNT(DISTINCT a.test_id),
        'total_attempts', COUNT(a.id),
        'completed_attempts', COUNT(CASE WHEN a.status = 'completed' THEN 1 END),
        'average_score', ROUND(COALESCE(AVG(r.percentage), 0), 2),
        'highest_score', COALESCE(MAX(r.percentage), 0),
        'lowest_score', COALESCE(MIN(r.percentage), 0),
        'total_correct_answers', COALESCE(SUM(r.correct_answers), 0),
        'total_questions_attempted', COALESCE(SUM(r.total_questions), 0),
        'subject_breakdown', (
            SELECT json_agg(
                json_build_object(
                    'subject', sub.subject_name,
                    'attempts', sub.attempt_count,
                    'avg_score', sub.avg_score
                )
            )
            FROM (
                SELECT
                    s.name AS subject_name,
                    COUNT(a2.id) AS attempt_count,
                    ROUND(AVG(r2.percentage), 2) AS avg_score
                FROM attempts a2
                JOIN tests t2 ON a2.test_id = t2.id
                JOIN subjects s ON t2.subject_id = s.id
                LEFT JOIN results r2 ON a2.id = r2.attempt_id
                WHERE a2.user_id = p_user_id AND a2.status = 'completed'
                GROUP BY s.name
            ) sub
        )
    ) INTO v_stats
    FROM attempts a
    LEFT JOIN results r ON a.id = r.attempt_id
    WHERE a.user_id = p_user_id;

    RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 3. get_test_results(p_test_id)
-- Returns all attempt results for a given test,
-- including student details and performance metrics.
-- ============================================================
CREATE OR REPLACE FUNCTION get_test_results(p_test_id INTEGER)
RETURNS TABLE (
    attempt_id INTEGER,
    student_name VARCHAR,
    student_email VARCHAR,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    total_questions INTEGER,
    correct_answers INTEGER,
    score INTEGER,
    percentage NUMERIC,
    time_taken_minutes NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id AS attempt_id,
        u.name AS student_name,
        u.email AS student_email,
        a.start_time,
        a.end_time,
        r.total_questions,
        r.correct_answers,
        r.score,
        r.percentage,
        ROUND(EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 60.0, 2) AS time_taken_minutes
    FROM attempts a
    JOIN users u ON a.user_id = u.id
    JOIN results r ON a.id = r.attempt_id
    WHERE a.test_id = p_test_id AND a.status = 'completed'
    ORDER BY r.percentage DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 4. get_dashboard_stats()
-- Returns admin dashboard statistics
-- ============================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM users),
        'total_students', (SELECT COUNT(*) FROM users WHERE role = 'student'),
        'total_instructors', (SELECT COUNT(*) FROM users WHERE role = 'instructor'),
        'pending_approvals', (SELECT COUNT(*) FROM users WHERE status = 'pending'),
        'total_tests', (SELECT COUNT(*) FROM tests),
        'published_tests', (SELECT COUNT(*) FROM tests WHERE is_published = TRUE),
        'total_questions', (SELECT COUNT(*) FROM questions),
        'total_subjects', (SELECT COUNT(*) FROM subjects),
        'total_attempts', (SELECT COUNT(*) FROM attempts WHERE status = 'completed'),
        'average_score', (SELECT ROUND(COALESCE(AVG(percentage), 0), 2) FROM results)
    ) INTO v_stats;

    RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
