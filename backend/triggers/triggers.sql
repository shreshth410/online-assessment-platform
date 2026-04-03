-- ============================================================
-- PostgreSQL Triggers
-- Demonstrates trigger-based automation
-- ============================================================

-- ============================================================
-- Trigger 1: Auto-calculate score after submitting test
-- Fires when attempt status changes to 'completed'
-- ============================================================
CREATE OR REPLACE FUNCTION trg_fn_calculate_score_on_complete()
RETURNS TRIGGER AS $$
BEGIN
    -- Only fire when status transitions to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        PERFORM calculate_test_score(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_calculate_score_after_complete
    AFTER UPDATE OF status ON attempts
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION trg_fn_calculate_score_on_complete();


-- ============================================================
-- Trigger 2: Prevent deleting questions that belong to tests
-- Fires before DELETE on questions table
-- ============================================================
CREATE OR REPLACE FUNCTION trg_fn_prevent_question_delete()
RETURNS TRIGGER AS $$
DECLARE
    v_test_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_test_count
    FROM test_questions
    WHERE question_id = OLD.id;

    IF v_test_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete question (ID: %) — it is used in % test(s). Remove it from all tests first.',
            OLD.id, v_test_count;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_prevent_question_delete
    BEFORE DELETE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_prevent_question_delete();


-- ============================================================
-- Trigger 3: Auto-update percentage when score changes
-- Fires after UPDATE on results table
-- ============================================================
CREATE OR REPLACE FUNCTION trg_fn_update_percentage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_questions > 0 THEN
        NEW.percentage := ROUND((NEW.score::NUMERIC / NEW.total_questions) * 100, 2);
    ELSE
        NEW.percentage := 0.00;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_update_percentage_on_score_change
    BEFORE UPDATE OF score ON results
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_update_percentage();


-- ============================================================
-- Trigger 4: Auto-set created_at on user profile insert
-- ============================================================
CREATE OR REPLACE FUNCTION trg_fn_set_created_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_at IS NULL THEN
        NEW.created_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_set_created_at
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_set_created_at();


-- ============================================================
-- Trigger 5: Log attempt completion to audit
-- (Optional — if audit_log table exists)
-- ============================================================
CREATE OR REPLACE FUNCTION trg_fn_log_attempt_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status = 'in_progress' THEN
        -- Could insert into an audit_log table if one exists
        RAISE NOTICE 'Attempt % completed by user % for test %',
            NEW.id, NEW.user_id, NEW.test_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_log_attempt_completion
    AFTER UPDATE OF status ON attempts
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_log_attempt_completion();
