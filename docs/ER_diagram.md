# ER Diagram — Online Assessment & Evaluation Platform

This document presents the Entity-Relationship diagram for the platform using Mermaid notation.

## ER Diagram

```mermaid
erDiagram
    USERS {
        UUID id PK "Linked to auth.users"
        VARCHAR name "NOT NULL"
        VARCHAR email "UNIQUE, NOT NULL"
        VARCHAR role "CHECK: admin/instructor/student"
        VARCHAR status "CHECK: pending/approved/rejected"
        TIMESTAMP created_at "DEFAULT NOW()"
    }

    SUBJECTS {
        SERIAL id PK
        VARCHAR name "UNIQUE, NOT NULL"
        TEXT description
    }

    QUESTIONS {
        SERIAL id PK
        INTEGER subject_id FK
        VARCHAR difficulty "CHECK: easy/medium/hard"
        TEXT question_text "NOT NULL"
        UUID created_by FK
        TIMESTAMP created_at
    }

    OPTIONS {
        SERIAL id PK
        INTEGER question_id FK
        TEXT option_text "NOT NULL"
        BOOLEAN is_correct "DEFAULT FALSE"
    }

    TESTS {
        SERIAL id PK
        VARCHAR title "NOT NULL"
        INTEGER subject_id FK
        INTEGER duration "CHECK > 0 (minutes)"
        UUID created_by FK
        BOOLEAN is_published "DEFAULT FALSE"
        TIMESTAMP created_at
    }

    TEST_QUESTIONS {
        SERIAL id PK
        INTEGER test_id FK
        INTEGER question_id FK
    }

    ATTEMPTS {
        SERIAL id PK
        UUID user_id FK
        INTEGER test_id FK
        TIMESTAMP start_time
        TIMESTAMP end_time
        INTEGER score "DEFAULT 0"
        VARCHAR status "CHECK: in_progress/completed/timed_out"
    }

    RESPONSES {
        SERIAL id PK
        INTEGER attempt_id FK
        INTEGER question_id FK
        INTEGER selected_option FK
    }

    RESULTS {
        SERIAL id PK
        INTEGER attempt_id FK "UNIQUE"
        INTEGER total_questions
        INTEGER correct_answers
        INTEGER score
        NUMERIC percentage "NUMERIC(5,2)"
    }

    %% Relationships
    USERS ||--o{ QUESTIONS : "creates"
    USERS ||--o{ TESTS : "creates"
    USERS ||--o{ ATTEMPTS : "takes"

    SUBJECTS ||--o{ QUESTIONS : "categorizes"
    SUBJECTS ||--o{ TESTS : "categorizes"

    QUESTIONS ||--|{ OPTIONS : "has exactly 4"
    QUESTIONS ||--o{ TEST_QUESTIONS : "included in"
    QUESTIONS ||--o{ RESPONSES : "answered in"

    TESTS ||--|{ TEST_QUESTIONS : "contains"
    TESTS ||--o{ ATTEMPTS : "attempted by"

    ATTEMPTS ||--|{ RESPONSES : "records"
    ATTEMPTS ||--|| RESULTS : "generates"

    OPTIONS ||--o{ RESPONSES : "selected as"
```

## Relationship Summary

| Relationship | Type | Description |
|-------------|------|-------------|
| User → Questions | 1:N | An instructor creates many questions |
| User → Tests | 1:N | An instructor creates many tests |
| User → Attempts | 1:N | A student makes many attempts |
| Subject → Questions | 1:N | A subject has many questions |
| Subject → Tests | 1:N | A subject has many tests |
| Question → Options | 1:4 | Each question has exactly 4 options |
| Test → Test_Questions | 1:N | A test contains many questions (junction) |
| Question → Test_Questions | 1:N | A question can be in many tests (junction) |
| Test → Attempts | 1:N | A test has many attempts |
| Attempt → Responses | 1:N | An attempt has many responses |
| Attempt → Result | 1:1 | Each attempt generates exactly one result |
| Option → Responses | 1:N | An option can be selected in many responses |

## Cardinality Notes

- **Tests ↔ Questions**: Many-to-Many relationship resolved through the `test_questions` junction table
- **Users → Attempts**: One-to-Many; students can attempt multiple tests
- **Attempts → Results**: One-to-One; each completed attempt has exactly one result record
- **Questions → Options**: One-to-Four; each question must have exactly 4 options with one correct answer
