-- ============================================================
-- Seed Data for Online Assessment & Evaluation Platform
-- ============================================================
-- NOTE: Run this AFTER schema.sql
-- NOTE: The admin user must be created via Supabase Auth first,
--       then insert the profile here with the matching UUID.
-- ============================================================

-- ============================================================
-- 1. INSERT SUBJECTS
-- ============================================================
INSERT INTO subjects (name, description) VALUES
    ('Database Management Systems', 'Covers SQL, normalization, ER modeling, and relational algebra'),
    ('Data Structures & Algorithms', 'Covers arrays, linked lists, trees, graphs, sorting, and searching'),
    ('Operating Systems', 'Covers process management, memory management, file systems, and scheduling'),
    ('Computer Networks', 'Covers OSI model, TCP/IP, routing, and network security'),
    ('Software Engineering', 'Covers SDLC, design patterns, testing, and project management')
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- 2. INSERT SAMPLE QUESTIONS & OPTIONS
-- ============================================================

-- ----- DBMS Questions -----

-- Q1: Easy
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (1, 'easy', 'Which SQL command is used to retrieve data from a database?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('INSERT', FALSE),
    ('SELECT', TRUE),
    ('UPDATE', FALSE),
    ('DELETE', FALSE)
) AS t(option_text, is_correct);

-- Q2: Easy
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (1, 'easy', 'Which constraint ensures that a column cannot have NULL values?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('UNIQUE', FALSE),
    ('CHECK', FALSE),
    ('NOT NULL', TRUE),
    ('DEFAULT', FALSE)
) AS t(option_text, is_correct);

-- Q3: Medium
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (1, 'medium', 'What is the highest level of normalization commonly used in practice?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('1NF', FALSE),
    ('2NF', FALSE),
    ('3NF', TRUE),
    ('BCNF', FALSE)
) AS t(option_text, is_correct);

-- Q4: Medium
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (1, 'medium', 'Which type of JOIN returns all rows from both tables, matching where possible?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('INNER JOIN', FALSE),
    ('LEFT JOIN', FALSE),
    ('RIGHT JOIN', FALSE),
    ('FULL OUTER JOIN', TRUE)
) AS t(option_text, is_correct);

-- Q5: Hard
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (1, 'hard', 'Which of the following is NOT a property of ACID transactions?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('Atomicity', FALSE),
    ('Consistency', FALSE),
    ('Isolation', FALSE),
    ('Durability is optional', TRUE)
) AS t(option_text, is_correct);

-- ----- DSA Questions -----

-- Q6: Easy
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (2, 'easy', 'What is the time complexity of accessing an element in an array by index?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('O(n)', FALSE),
    ('O(1)', TRUE),
    ('O(log n)', FALSE),
    ('O(n^2)', FALSE)
) AS t(option_text, is_correct);

-- Q7: Easy
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (2, 'easy', 'Which data structure follows the LIFO principle?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('Queue', FALSE),
    ('Stack', TRUE),
    ('Array', FALSE),
    ('Linked List', FALSE)
) AS t(option_text, is_correct);

-- Q8: Medium
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (2, 'medium', 'What is the worst-case time complexity of QuickSort?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('O(n log n)', FALSE),
    ('O(n)', FALSE),
    ('O(n^2)', TRUE),
    ('O(log n)', FALSE)
) AS t(option_text, is_correct);

-- Q9: Hard
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (2, 'hard', 'What is the time complexity of finding the shortest path using Dijkstra''s algorithm with a binary heap?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('O(V^2)', FALSE),
    ('O(E log V)', TRUE),
    ('O(V + E)', FALSE),
    ('O(V * E)', FALSE)
) AS t(option_text, is_correct);

-- ----- Operating Systems Questions -----

-- Q10: Easy
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (3, 'easy', 'Which scheduling algorithm gives the minimum average waiting time?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('FCFS', FALSE),
    ('SJF', TRUE),
    ('Round Robin', FALSE),
    ('Priority', FALSE)
) AS t(option_text, is_correct);

-- Q11: Medium
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (3, 'medium', 'What is a deadlock in operating systems?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('A process that runs forever', FALSE),
    ('A situation where processes wait indefinitely for resources held by each other', TRUE),
    ('A scheduling issue', FALSE),
    ('A type of memory leak', FALSE)
) AS t(option_text, is_correct);

-- Q12: Hard
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (3, 'hard', 'Which page replacement algorithm suffers from Belady''s anomaly?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('LRU', FALSE),
    ('Optimal', FALSE),
    ('FIFO', TRUE),
    ('LFU', FALSE)
) AS t(option_text, is_correct);

-- ----- Computer Networks Questions -----

-- Q13: Easy
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (4, 'easy', 'How many layers are in the OSI model?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('5', FALSE),
    ('6', FALSE),
    ('7', TRUE),
    ('4', FALSE)
) AS t(option_text, is_correct);

-- Q14: Medium
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (4, 'medium', 'Which protocol operates at the transport layer and provides reliable delivery?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('HTTP', FALSE),
    ('TCP', TRUE),
    ('IP', FALSE),
    ('UDP', FALSE)
) AS t(option_text, is_correct);

-- Q15: Hard
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (4, 'hard', 'What is the purpose of the ARP protocol?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('Routing packets between networks', FALSE),
    ('Resolving domain names to IP addresses', FALSE),
    ('Mapping IP addresses to MAC addresses', TRUE),
    ('Establishing TCP connections', FALSE)
) AS t(option_text, is_correct);

-- ----- Software Engineering Questions -----

-- Q16: Easy
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (5, 'easy', 'Which SDLC model is also known as the linear sequential model?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('Agile', FALSE),
    ('Waterfall', TRUE),
    ('Spiral', FALSE),
    ('V-Model', FALSE)
) AS t(option_text, is_correct);

-- Q17: Medium
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (5, 'medium', 'What design pattern provides a way to create objects without specifying the exact class?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('Singleton', FALSE),
    ('Observer', FALSE),
    ('Factory', TRUE),
    ('Strategy', FALSE)
) AS t(option_text, is_correct);

-- Q18: Easy
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (1, 'easy', 'What does SQL stand for?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('Structured Query Language', TRUE),
    ('Simple Query Language', FALSE),
    ('Standard Query Logic', FALSE),
    ('Sequential Query Language', FALSE)
) AS t(option_text, is_correct);

-- Q19: Medium
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (2, 'medium', 'Which traversal of a Binary Search Tree gives elements in sorted order?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('Preorder', FALSE),
    ('Postorder', FALSE),
    ('Inorder', TRUE),
    ('Level order', FALSE)
) AS t(option_text, is_correct);

-- Q20: Medium
INSERT INTO questions (subject_id, difficulty, question_text)
VALUES (3, 'medium', 'What is the main purpose of virtual memory?');
INSERT INTO options (question_id, option_text, is_correct)
SELECT currval('questions_id_seq'), option_text, is_correct FROM (VALUES
    ('To increase CPU speed', FALSE),
    ('To allow execution of processes larger than physical memory', TRUE),
    ('To manage network connections', FALSE),
    ('To provide file encryption', FALSE)
) AS t(option_text, is_correct);


-- ============================================================
-- NOTE: After running this seed data, you need to:
-- 1. Create an admin user via Supabase Auth (email: admin@assessment.com)
-- 2. Insert the admin profile:
--    INSERT INTO users (id, name, email, role, status)
--    VALUES ('<admin-auth-uuid>', 'Admin User', 'admin@assessment.com', 'admin', 'approved');
-- ============================================================
