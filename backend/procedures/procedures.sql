-- ============================================================
-- PostgreSQL Stored Procedures (PL/pgSQL)
-- Demonstrates procedures with cursors for business logic
-- ============================================================


-- ============================================================
-- 1. generate_results(p_attempt_id)
-- Generates the complete result for an attempt.
-- Uses a CURSOR to iterate through responses, compare with
-- correct answers, and insert/update the results table.
-- ============================================================
CREATE OR REPLACE PROCEDURE generate_results(p_attempt_id INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_questions INTEGER := 0;
    v_correct INTEGER := 0;
    v_percentage NUMERIC(5,2) := 0.00;
    v_test_id INTEGER;
    rec RECORD;
    -- CURSOR to iterate through all responses for this attempt
    response_cur CURSOR FOR
        SELECT
            r.question_id,
            r.selected_option,
            o.is_correct
        FROM responses r
        LEFT JOIN options o ON r.selected_option = o.id
        WHERE r.attempt_id = p_attempt_id;
BEGIN
    -- Get the test_id for this attempt
    SELECT test_id INTO v_test_id
    FROM attempts
    WHERE id = p_attempt_id;

    IF v_test_id IS NULL THEN
        RAISE EXCEPTION 'Attempt % not found', p_attempt_id;
    END IF;

    -- Count total questions in the test
    SELECT COUNT(*) INTO v_total_questions
    FROM test_questions
    WHERE test_id = v_test_id;

    -- Open cursor and iterate through each response
    OPEN response_cur;
    LOOP
        FETCH response_cur INTO rec;
        EXIT WHEN NOT FOUND;

        -- Increment correct count if selected option is correct
        IF rec.is_correct = TRUE THEN
            v_correct := v_correct + 1;
        END IF;
    END LOOP;
    CLOSE response_cur;

    -- Calculate percentage
    IF v_total_questions > 0 THEN
        v_percentage := ROUND((v_correct::NUMERIC / v_total_questions) * 100, 2);
    END IF;

    -- Upsert into results table
    INSERT INTO results (attempt_id, total_questions, correct_answers, score, percentage)
    VALUES (p_attempt_id, v_total_questions, v_correct, v_correct, v_percentage)
    ON CONFLICT (attempt_id)
    DO UPDATE SET
        total_questions = EXCLUDED.total_questions,
        correct_answers = EXCLUDED.correct_answers,
        score = EXCLUDED.score,
        percentage = EXCLUDED.percentage;

    -- Mark attempt as completed
    UPDATE attempts
    SET
        status = 'completed',
        end_time = NOW(),
        score = v_correct
    WHERE id = p_attempt_id;

    RAISE NOTICE 'Results generated for attempt %: %/% correct (%.2f%%)',
        p_attempt_id, v_correct, v_total_questions, v_percentage;
END;
$$;


-- ============================================================
-- 2. retrieve_performance_summary(p_user_id)
-- Retrieves a comprehensive performance summary for a student.
-- Uses cursors to iterate through subjects and compute
-- per-subject stats.
-- ============================================================
CREATE OR REPLACE PROCEDURE retrieve_performance_summary(
    p_user_id UUID,
    INOUT p_result JSON DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_subject RECORD;
    v_subject_stats JSON[];
    v_overall_avg NUMERIC;
    v_total_attempts INTEGER;
    v_total_correct INTEGER;
    v_total_questions INTEGER;
    -- CURSOR to iterate through each subject the student has attempted
    subject_cur CURSOR FOR
        SELECT DISTINCT s.id, s.name
        FROM subjects s
        JOIN tests t ON s.id = t.subject_id
        JOIN attempts a ON t.id = a.test_id
        WHERE a.user_id = p_user_id AND a.status = 'completed';
BEGIN
    -- Initialize counters
    v_subject_stats := ARRAY[]::JSON[];
    v_total_correct := 0;
    v_total_questions := 0;
    v_total_attempts := 0;

    -- Iterate through subjects using cursor
    OPEN subject_cur;
    LOOP
        FETCH subject_cur INTO v_subject;
        EXIT WHEN NOT FOUND;

        -- Get per-subject statistics
        DECLARE
            v_sub_attempts INTEGER;
            v_sub_avg NUMERIC;
            v_sub_best NUMERIC;
            v_sub_correct INTEGER;
            v_sub_total INTEGER;
        BEGIN
            SELECT
                COUNT(a.id),
                ROUND(COALESCE(AVG(r.percentage), 0), 2),
                COALESCE(MAX(r.percentage), 0),
                COALESCE(SUM(r.correct_answers), 0),
                COALESCE(SUM(r.total_questions), 0)
            INTO v_sub_attempts, v_sub_avg, v_sub_best, v_sub_correct, v_sub_total
            FROM attempts a
            JOIN tests t ON a.test_id = t.id
            LEFT JOIN results r ON a.id = r.attempt_id
            WHERE a.user_id = p_user_id
              AND t.subject_id = v_subject.id
              AND a.status = 'completed';

            -- Accumulate totals
            v_total_attempts := v_total_attempts + v_sub_attempts;
            v_total_correct := v_total_correct + v_sub_correct;
            v_total_questions := v_total_questions + v_sub_total;

            -- Append to subject stats array
            v_subject_stats := array_append(v_subject_stats, json_build_object(
                'subject_id', v_subject.id,
                'subject_name', v_subject.name,
                'attempts', v_sub_attempts,
                'average_percentage', v_sub_avg,
                'best_percentage', v_sub_best,
                'correct_answers', v_sub_correct,
                'total_questions', v_sub_total
            ));
        END;
    END LOOP;
    CLOSE subject_cur;

    -- Calculate overall average
    IF v_total_questions > 0 THEN
        v_overall_avg := ROUND((v_total_correct::NUMERIC / v_total_questions) * 100, 2);
    ELSE
        v_overall_avg := 0;
    END IF;

    -- Build final JSON result
    p_result := json_build_object(
        'user_id', p_user_id,
        'total_attempts', v_total_attempts,
        'overall_accuracy', v_overall_avg,
        'total_correct_answers', v_total_correct,
        'total_questions_attempted', v_total_questions,
        'subjects', to_json(v_subject_stats)
    );
END;
$$;


-- ============================================================
-- 3. reset_test_attempts(p_test_id, p_user_id)
-- Resets all attempts for a specific test by a specific student.
-- Deletes responses, results, and the attempt records.
-- ============================================================
CREATE OR REPLACE PROCEDURE reset_test_attempts(
    p_test_id INTEGER,
    p_user_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_attempt_ids INTEGER[];
    v_count INTEGER;
BEGIN
    -- Collect attempt IDs to delete
    SELECT ARRAY_AGG(id) INTO v_attempt_ids
    FROM attempts
    WHERE test_id = p_test_id AND user_id = p_user_id;

    IF v_attempt_ids IS NULL OR array_length(v_attempt_ids, 1) IS NULL THEN
        RAISE NOTICE 'No attempts found for test % by user %', p_test_id, p_user_id;
        RETURN;
    END IF;

    v_count := array_length(v_attempt_ids, 1);

    -- Delete results (cascade will handle via FK, but explicit for clarity)
    DELETE FROM results WHERE attempt_id = ANY(v_attempt_ids);

    -- Delete responses
    DELETE FROM responses WHERE attempt_id = ANY(v_attempt_ids);

    -- Delete attempts
    DELETE FROM attempts WHERE id = ANY(v_attempt_ids);

    RAISE NOTICE 'Reset % attempt(s) for test % by user %', v_count, p_test_id, p_user_id;
END;
$$;


-- ============================================================
-- 4. bulk_approve_users(p_user_ids)
-- Approves multiple pending users at once.
-- Uses a loop to iterate through the array of user IDs.
-- ============================================================
CREATE OR REPLACE PROCEDURE bulk_approve_users(p_user_ids UUID[])
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
    v_count INTEGER := 0;
BEGIN
    FOREACH v_user_id IN ARRAY p_user_ids
    LOOP
        UPDATE users
        SET status = 'approved'
        WHERE id = v_user_id AND status = 'pending';

        IF FOUND THEN
            v_count := v_count + 1;
        END IF;
    END LOOP;

    RAISE NOTICE 'Approved % user(s)', v_count;
END;
$$;
