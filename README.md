# AssessHub — Online Assessment & Evaluation Platform

A full-stack, database-driven web application that demonstrates practical DBMS concepts including SQL, integrity constraints, relational schema design, normalization, complex queries, stored procedures, cursors, triggers, and ER modeling.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) |
| Backend/DB | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Styling | Vanilla CSS (Dark theme, Glassmorphism) |

## Features

- **Authentication**: Registration, login, logout with role-based access (Admin, Instructor, Student)
- **Admin Approval**: All new registrations require admin approval
- **Question Bank**: CRUD interface with subject/difficulty filters
- **Test Creation**: Drag-and-pick question selection with publish/draft
- **Test Taking**: One-question-at-a-time with timer and question palette
- **Auto-Scoring**: Triggers and functions calculate scores automatically
- **Result Review**: Detailed question-by-question review with color coding
- **Dashboards**: Role-specific dashboards with performance statistics

## DBMS Concepts Demonstrated

- DDL/DML commands (CREATE, ALTER, INSERT, UPDATE, DELETE, SELECT)
- Integrity constraints (PK, FK, UNIQUE, CHECK, NOT NULL, DEFAULT)
- Normalization to Third Normal Form (3NF)
- Set operations (UNION, INTERSECT, EXCEPT)
- Views (5 database views)
- Complex queries (GROUP BY, HAVING, JOINs, Subqueries, CTEs)
- PL/pgSQL functions (4 functions)
- Cursors (used in score calculation)
- Stored procedures (4 procedures)
- Triggers (5 triggers)
- ER modeling (9 entities with relationships)
- Row Level Security (RLS)
- Indexes for performance

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** → choose an organization → name it `online-assessment-platform`
3. Set a database password and select a region close to you
4. Wait for the project to finish provisioning (~2 minutes)

### 2. Configure the Database

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the following SQL files **in order**:
   1. `backend/database/schema.sql` — Creates all tables, constraints, indexes, and RLS policies
   2. `backend/functions/functions.sql` — Creates database functions
   3. `backend/procedures/procedures.sql` — Creates stored procedures
   4. `backend/triggers/triggers.sql` — Creates database triggers
   5. `backend/database/seed.sql` — Inserts sample data (subjects and questions)

### 3. Create an Admin User

1. Go to **Authentication → Users** in Supabase dashboard
2. Click **Add User** → create with email `admin@assessment.com` and a password
3. Copy the user's UUID
4. Run this SQL in the SQL Editor:
   ```sql
   INSERT INTO users (id, name, email, role, status)
   VALUES ('<paste-uuid-here>', 'Admin', 'admin@assessment.com', 'admin', 'approved');
   ```

### 4. Configure Authentication

1. Go to **Authentication → Settings → Email**
2. Enable **Email** sign-in provider
3. Disable **Confirm email** (for local development)

### 5. Setup Frontend

1. Copy your Supabase credentials:
   - Go to **Settings → API**
   - Copy the **Project URL** and **anon/public key**

2. Create environment file:
   ```bash
   cd frontend
   cp .env.example .env
   ```

3. Edit `.env` with your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. Install dependencies and start:
   ```bash
   npm install
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173)

### 6. Login and Use

1. Log in as admin with the credentials you created
2. Register new users (student/instructor) — they'll need admin approval
3. Approve users from the admin dashboard
4. Instructors can create questions and tests
5. Students can take tests and view results

## Project Structure

```
online-assessment-platform/
├── frontend/                      # React (Vite) application
│   ├── src/
│   │   ├── contexts/              # AuthContext (auth state)
│   │   ├── layouts/               # AuthLayout, DashboardLayout
│   │   ├── pages/
│   │   │   ├── auth/              # Login, Register, PendingApproval
│   │   │   ├── admin/             # Admin dashboard
│   │   │   ├── instructor/        # Questions, Tests, Results
│   │   │   └── student/           # Dashboard, TestAttempt, Results
│   │   ├── services/              # Supabase client
│   │   ├── App.jsx                # Routing & guards
│   │   └── index.css              # Design system
│   └── package.json
│
├── backend/
│   ├── database/
│   │   ├── schema.sql             # Tables, constraints, indexes, RLS
│   │   └── seed.sql               # Sample data
│   ├── queries/
│   │   ├── basic_queries.sql      # DDL & DML examples
│   │   ├── intermediate_queries.sql # UNION, INTERSECT, EXCEPT, VIEWs
│   │   └── complex_queries.sql    # JOINs, Subqueries, CTEs
│   ├── functions/
│   │   └── functions.sql          # PL/pgSQL functions
│   ├── procedures/
│   │   └── procedures.sql         # Stored procedures with cursors
│   └── triggers/
│       └── triggers.sql           # Database triggers
│
├── docs/
│   ├── ER_diagram.md              # Entity-Relationship diagram
│   ├── schema_design.md           # Normalization analysis
│   └── dbms_concepts.md           # Concept-to-implementation map
│
└── README.md
```

## Sample Queries

### Average score per subject
```sql
SELECT s.name, AVG(r.percentage) AS avg_score
FROM subjects s
JOIN tests t ON s.id = t.subject_id
JOIN attempts a ON t.id = a.test_id
JOIN results r ON a.id = r.attempt_id
WHERE a.status = 'completed'
GROUP BY s.name ORDER BY avg_score DESC;
```

### Find students with highest score
```sql
SELECT u.name, MAX(r.percentage) AS best_score
FROM users u
JOIN attempts a ON u.id = a.user_id
JOIN results r ON a.id = r.attempt_id
GROUP BY u.name ORDER BY best_score DESC;
```

## License

This project is for educational purposes demonstrating DBMS concepts.
