# Schema Design & Normalization

This document describes the relational schema and demonstrates normalization to Third Normal Form (3NF).

---

## Relational Schema

### 1. Users
```
users(id, name, email, role, status, created_at)
  PK: id (UUID)
  FK: id → auth.users(id)
  UNIQUE: email
  CHECK: role IN ('admin', 'instructor', 'student')
  CHECK: status IN ('pending', 'approved', 'rejected')
```

### 2. Subjects
```
subjects(id, name, description)
  PK: id (SERIAL)
  UNIQUE: name
```

### 3. Questions
```
questions(id, subject_id, difficulty, question_text, created_by, created_at)
  PK: id (SERIAL)
  FK: subject_id → subjects(id)
  FK: created_by → users(id)
  CHECK: difficulty IN ('easy', 'medium', 'hard')
```

### 4. Options
```
options(id, question_id, option_text, is_correct)
  PK: id (SERIAL)
  FK: question_id → questions(id) ON DELETE CASCADE
```

### 5. Tests
```
tests(id, title, subject_id, duration, created_by, is_published, created_at)
  PK: id (SERIAL)
  FK: subject_id → subjects(id)
  FK: created_by → users(id)
  CHECK: duration > 0
```

### 6. Test_Questions (Junction Table)
```
test_questions(id, test_id, question_id)
  PK: id (SERIAL)
  FK: test_id → tests(id) ON DELETE CASCADE
  FK: question_id → questions(id)
  UNIQUE: (test_id, question_id)
```

### 7. Attempts
```
attempts(id, user_id, test_id, start_time, end_time, score, status)
  PK: id (SERIAL)
  FK: user_id → users(id)
  FK: test_id → tests(id)
  CHECK: status IN ('in_progress', 'completed', 'timed_out')
```

### 8. Responses
```
responses(id, attempt_id, question_id, selected_option)
  PK: id (SERIAL)
  FK: attempt_id → attempts(id) ON DELETE CASCADE
  FK: question_id → questions(id)
  FK: selected_option → options(id)
  UNIQUE: (attempt_id, question_id)
```

### 9. Results
```
results(id, attempt_id, total_questions, correct_answers, score, percentage)
  PK: id (SERIAL)
  FK: attempt_id → attempts(id) ON DELETE CASCADE
  UNIQUE: attempt_id
```

---

## Normalization Analysis

### First Normal Form (1NF)
All tables satisfy 1NF because:
- Every column contains atomic (indivisible) values
- There are no repeating groups
- Each table has a primary key
- All entries in a column are of the same data type

**Example**: Options are stored in a separate `options` table, not as comma-separated values in the `questions` table. Each option is an independent row.

### Second Normal Form (2NF)
All tables satisfy 2NF because:
- They are already in 1NF
- All non-key attributes are fully functionally dependent on the entire primary key
- No partial dependencies exist (since we use single-column surrogate keys)

**Example**: In `test_questions`, the composite uniqueness constraint `(test_id, question_id)` ensures no partial dependency. The surrogate key `id` is the PK, and both `test_id` and `question_id` are required.

### Third Normal Form (3NF)
All tables satisfy 3NF because:
- They are already in 2NF
- No transitive dependencies exist — every non-key attribute depends directly on the primary key, not on another non-key attribute

**Verification per table**:

| Table | Non-key attributes | Transitive dependencies? |
|-------|-------------------|-------------------------|
| users | name, email, role, status, created_at | None — all depend only on id |
| subjects | name, description | None — all depend only on id |
| questions | subject_id, difficulty, question_text, created_by, created_at | None — subject info stored in subjects table |
| options | question_id, option_text, is_correct | None — all depend only on id |
| tests | title, subject_id, duration, created_by, is_published, created_at | None — subject info in subjects, creator info in users |
| test_questions | test_id, question_id | None — junction table, no derived data |
| attempts | user_id, test_id, start_time, end_time, score, status | None — user info in users, test info in tests |
| responses | attempt_id, question_id, selected_option | None — all FKs to other tables |
| results | attempt_id, total_questions, correct_answers, score, percentage | percentage is derived from score/total, BUT it's stored for query performance and maintained by a trigger |

> **Note on Results table**: `percentage` could be considered derivable from `score` and `total_questions`. However, we store it explicitly for query performance, and a database trigger (`trg_update_percentage_on_score_change`) ensures consistency. This is a common accepted practice in database design known as "controlled denormalization."

---

## Foreign Key Relationship Map

```
auth.users ←── users.id
users.id ←── questions.created_by
users.id ←── tests.created_by
users.id ←── attempts.user_id
subjects.id ←── questions.subject_id
subjects.id ←── tests.subject_id
questions.id ←── options.question_id
questions.id ←── test_questions.question_id
questions.id ←── responses.question_id
tests.id ←── test_questions.test_id
tests.id ←── attempts.test_id
attempts.id ←── responses.attempt_id
attempts.id ←── results.attempt_id
options.id ←── responses.selected_option
```

---

## Indexes

| Index | Table | Column(s) | Purpose |
|-------|-------|-----------|---------|
| idx_users_role | users | role | Filter users by role |
| idx_users_status | users | status | Filter pending approvals |
| idx_questions_subject_id | questions | subject_id | Join/filter by subject |
| idx_questions_difficulty | questions | difficulty | Filter by difficulty |
| idx_options_question_id | options | question_id | Join options to questions |
| idx_test_questions_test_id | test_questions | test_id | Join test to questions |
| idx_test_questions_question_id | test_questions | question_id | Reverse lookup |
| idx_attempts_user_id | attempts | user_id | Student's attempt history |
| idx_attempts_test_id | attempts | test_id | Test attempt statistics |
| idx_responses_attempt_id | responses | attempt_id | Fetch responses per attempt |
| idx_responses_question_id | responses | question_id | Question response analysis |
| idx_results_attempt_id | results | attempt_id | Link results to attempts |
