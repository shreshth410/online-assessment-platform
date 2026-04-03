# DBMS Concepts Reference

This document explains each DBMS concept demonstrated in the project and maps them to their implementation files.

---

## 1. Introduction to SQL

### DDL (Data Definition Language)
Commands that define or modify database structure.

| Command | Example | File |
|---------|---------|------|
| `CREATE TABLE` | All 9 tables defined with columns & types | `backend/database/schema.sql` |
| `ALTER TABLE` | Add columns, constraints | `backend/queries/basic_queries.sql` |
| `DROP TABLE` | Remove a table entirely | `backend/queries/basic_queries.sql` |
| `TRUNCATE` | Remove all rows from a table | `backend/queries/basic_queries.sql` |

### DML (Data Manipulation Language)
Commands that manipulate data within tables.

| Command | Example | File |
|---------|---------|------|
| `INSERT` | Insert subjects, questions, options | `backend/database/seed.sql` |
| `UPDATE` | Update user status, question difficulty | `backend/queries/basic_queries.sql` |
| `DELETE` | Remove questions, attempts | `backend/queries/basic_queries.sql` |
| `SELECT` | Various queries with WHERE, ORDER BY, LIMIT | `backend/queries/basic_queries.sql` |

**Reference**: [`basic_queries.sql`](../backend/queries/basic_queries.sql)

---

## 2. Integrity Constraints

Constraints ensure data integrity and consistency.

| Constraint | Usage | Location |
|-----------|-------|----------|
| `PRIMARY KEY` | Every table has a PK (id) | `schema.sql` — all tables |
| `FOREIGN KEY` | 12+ foreign key relationships | `schema.sql` — relationships between all tables |
| `NOT NULL` | name, email, question_text, etc. | `schema.sql` — critical fields |
| `UNIQUE` | email (users), name (subjects), (test_id, question_id) | `schema.sql` |
| `CHECK` | role restricted to 3 values, difficulty to 3 values, status to 3 values | `schema.sql` — users, questions, attempts |
| `DEFAULT` | created_at DEFAULT NOW(), is_correct DEFAULT FALSE, status DEFAULT 'pending' | `schema.sql` — multiple tables |

### Examples
- `email UNIQUE NOT NULL` — ensures no duplicate emails
- `role CHECK (role IN ('admin', 'instructor', 'student'))` — validates role values
- `difficulty CHECK (difficulty IN ('easy', 'medium', 'hard'))` — validates difficulty
- `ON DELETE CASCADE` — options/responses deleted when parent deleted
- `ON DELETE RESTRICT` — prevents deleting subjects with questions

**Reference**: [`schema.sql`](../backend/database/schema.sql)

---

## 3. Intermediate SQL

### Set Operations

| Operation | Description | File |
|-----------|-------------|------|
| `UNION` | Students who attempted Test 1 OR Test 2 | `intermediate_queries.sql` |
| `UNION ALL` | Same but keeping duplicates | `intermediate_queries.sql` |
| `INTERSECT` | Students who attempted BOTH tests | `intermediate_queries.sql` |
| `EXCEPT` | Students who attempted Test 1 but NOT Test 2 | `intermediate_queries.sql` |

### Views

| View Name | Description |
|-----------|-------------|
| `completed_tests_view` | All completed test attempts with scores and time taken |
| `question_bank_summary` | Question count by subject and difficulty |
| `test_overview` | Test details with question counts |
| `student_performance_summary` | Comprehensive student stats |
| `available_tests` | Published tests with question counts |

**Reference**: [`intermediate_queries.sql`](../backend/queries/intermediate_queries.sql)

---

## 4. Complex Queries

| Concept | Example Query | File |
|---------|--------------|------|
| `GROUP BY` | Average score per subject | `complex_queries.sql` |
| `HAVING` | Subjects with more than 5 attempts | `complex_queries.sql` |
| `ORDER BY` | Sort students by score descending | `complex_queries.sql` |
| `INNER JOIN` | Attempts with student and test details | `complex_queries.sql` |
| `LEFT JOIN` | All students including those with zero attempts | `complex_queries.sql` |
| `FULL OUTER JOIN` | All tests and subjects | `complex_queries.sql` |
| Self JOIN | Students who attempted the same test | `complex_queries.sql` |
| Subqueries | Students scoring above average | `complex_queries.sql` |
| Correlated Subquery | Top performer per test | `complex_queries.sql` |
| `WITH` (CTE) | Student performance with class comparison | `complex_queries.sql` |

**Reference**: [`complex_queries.sql`](../backend/queries/complex_queries.sql)

---

## 5. ER Model

The ER diagram models 9 entities with their attributes and relationships:

- **Entities**: Users, Subjects, Questions, Options, Tests, Test_Questions, Attempts, Responses, Results
- **Relationships**: 1:N (User→Attempts), M:N (Test↔Questions via junction), 1:1 (Attempt→Result)
- **Cardinality**: Clearly defined with proper constraints

**Reference**: [`ER_diagram.md`](ER_diagram.md)

---

## 6. PL/pgSQL Functions

PostgreSQL functions implementing business logic:

| Function | Purpose | Key Feature |
|----------|---------|-------------|
| `calculate_test_score(attempt_id)` | Calculates correct answers using cursor | Uses CURSOR, loops, conditional logic |
| `get_student_statistics(user_id)` | Returns comprehensive stats as JSON | JSON aggregation, subqueries |
| `get_test_results(test_id)` | Returns all attempt results for a test | RETURNS TABLE, joins |
| `get_dashboard_stats()` | Returns admin dashboard statistics | Multiple subqueries, JSON building |

**Reference**: [`functions.sql`](../backend/functions/functions.sql)

---

## 7. Cursors

Cursors are used to iterate through row sets one at a time. This project demonstrates cursors in:

### In `calculate_test_score()` function:
```sql
DECLARE
    response_cursor CURSOR FOR
        SELECT r.question_id, r.selected_option
        FROM responses r WHERE r.attempt_id = p_attempt_id;
BEGIN
    OPEN response_cursor;
    LOOP
        FETCH response_cursor INTO v_question_id, v_selected_option;
        EXIT WHEN NOT FOUND;
        -- Check if selected option is correct
        -- Increment score counter
    END LOOP;
    CLOSE response_cursor;
END;
```

### In `generate_results()` procedure:
- Iterates through all responses for an attempt
- Compares each selected option with the correct answer
- Maintains a running count of correct answers

### In `retrieve_performance_summary()` procedure:
- Iterates through subjects using a cursor
- Computes per-subject statistics within the loop
- Builds a comprehensive JSON result

**Reference**: [`functions.sql`](../backend/functions/functions.sql), [`procedures.sql`](../backend/procedures/procedures.sql)

---

## 8. Stored Procedures

| Procedure | Purpose | Key Feature |
|-----------|---------|-------------|
| `generate_results(attempt_id)` | Full result generation with cursor | Cursor iteration, upsert, status update |
| `retrieve_performance_summary(user_id)` | Comprehensive student performance | Nested cursor, JSON building |
| `reset_test_attempts(test_id, user_id)` | Clear attempts for re-take | Cascading deletes, array operations |
| `bulk_approve_users(user_ids[])` | Approve multiple pending users | Array iteration, batch update |

**Reference**: [`procedures.sql`](../backend/procedures/procedures.sql)

---

## 9. Triggers

| Trigger | Event | Action | File |
|---------|-------|--------|------|
| `trg_calculate_score_after_complete` | AFTER UPDATE status ON attempts | Calls `calculate_test_score()` | `triggers.sql` |
| `trg_prevent_question_delete` | BEFORE DELETE ON questions | Raises exception if question is in a test | `triggers.sql` |
| `trg_update_percentage_on_score_change` | BEFORE UPDATE score ON results | Recalculates percentage | `triggers.sql` |
| `trg_set_created_at` | BEFORE INSERT ON users | Auto-sets created_at timestamp | `triggers.sql` |
| `trg_log_attempt_completion` | AFTER UPDATE status ON attempts | Logs completion event | `triggers.sql` |

### Trigger Flow Example
```
Student submits test
  → responses inserted
  → attempt status updated to 'completed'
  → trg_calculate_score_after_complete fires
    → calculate_test_score() called
      → cursor iterates through responses
      → score and percentage calculated
      → results table updated
        → trg_update_percentage_on_score_change fires
          → percentage recalculated for consistency
```

**Reference**: [`triggers.sql`](../backend/triggers/triggers.sql)

---

## Concept-to-File Mapping

| DBMS Concept | Primary File(s) |
|-------------|----------------|
| DDL Commands | `schema.sql`, `basic_queries.sql` |
| DML Commands | `seed.sql`, `basic_queries.sql` |
| Integrity Constraints | `schema.sql` |
| Normalization (3NF) | `schema_design.md` |
| Set Operations | `intermediate_queries.sql` |
| Views | `intermediate_queries.sql` |
| Complex Queries | `complex_queries.sql` |
| Joins | `complex_queries.sql` |
| Subqueries & CTEs | `complex_queries.sql` |
| ER Model | `ER_diagram.md` |
| Functions (PL/pgSQL) | `functions.sql` |
| Cursors | `functions.sql`, `procedures.sql` |
| Stored Procedures | `procedures.sql` |
| Triggers | `triggers.sql` |
| Row Level Security | `schema.sql` |
| Indexes | `schema.sql` |
