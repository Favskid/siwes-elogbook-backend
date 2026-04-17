-- Database seed data
-- ============================================================
-- SIWES E-LOGBOOK SEED DATA
-- Passwords are all: Password123!
-- bcrypt hash for "Password123!" with 12 rounds
-- ============================================================

-- ─── Departments ─────────────────────────────────────────────

INSERT INTO departments (id, name, code) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Computer Science', 'CSC'),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'Electrical Engineering', 'EEE'),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'Mechanical Engineering', 'MEE'),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'Civil Engineering', 'CVE')
ON CONFLICT DO NOTHING;


-- ─── Admin ───────────────────────────────────────────────────

INSERT INTO users (id, name, email, password, role) VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'System Administrator',
    'admin@caritas.edu.ng',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGqIXCOdKYBRVOBB7KX/8wXfB6.',
    'admin'
  )
ON CONFLICT DO NOTHING;


-- ─── School Supervisor ────────────────────────────────────────

INSERT INTO users (id, name, email, password, role, department) VALUES
  (
    'b2000000-0000-0000-0000-000000000002',
    'Dr. Emeka Okafor',
    'emeka.okafor@caritas.edu.ng',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGqIXCOdKYBRVOBB7KX/8wXfB6.',
    'school_supervisor',
    'Computer Science'
  )
ON CONFLICT DO NOTHING;


-- ─── Assign school supervisor to CSC department ───────────────

UPDATE departments
  SET supervisor_id = 'b2000000-0000-0000-0000-000000000002'
  WHERE code = 'CSC';


-- ─── Industry Supervisor ──────────────────────────────────────

INSERT INTO users (id, name, email, password, role, company) VALUES
  (
    'b3000000-0000-0000-0000-000000000003',
    'Mr. Babatunde Adeyemi',
    'babatunde@techcorp.ng',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGqIXCOdKYBRVOBB7KX/8wXfB6.',
    'industry_supervisor',
    'TechCorp Nigeria Ltd'
  )
ON CONFLICT DO NOTHING;


-- ─── Students ─────────────────────────────────────────────────

INSERT INTO users (id, name, email, password, role, matric_number, department) VALUES
  (
    'b4000000-0000-0000-0000-000000000004',
    'Chioma Adaeze Okonkwo',
    'chioma@student.caritas.edu.ng',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGqIXCOdKYBRVOBB7KX/8wXfB6.',
    'student',
    'CSC/2021/001',
    'Computer Science'
  ),
  (
    'b5000000-0000-0000-0000-000000000005',
    'Emeka Chukwu',
    'emeka@student.caritas.edu.ng',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGqIXCOdKYBRVOBB7KX/8wXfB6.',
    'student',
    'CSC/2021/002',
    'Computer Science'
  )
ON CONFLICT DO NOTHING;


-- ─── Log Entries ──────────────────────────────────────────────

INSERT INTO log_entries (
  id, student_id, date, week_number,
  activity_description, tools_equipment,
  skills_acquired, challenges_faced,
  status, supervisor_id, supervisor_comment
) VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'b4000000-0000-0000-0000-000000000004',
    '2024-01-08',
    1,
    'Orientation and introduction to the company. Met with the team lead and was briefed on company policies, workflow, and assigned projects for the SIWES period.',
    'Company handbook, Microsoft Teams, Slack, Google Workspace',
    'Professional communication, team collaboration, understanding corporate culture',
    'Adapting to the corporate environment and understanding the internal tools used by the team.',
    'approved',
    'b3000000-0000-0000-0000-000000000003',
    'Great start! Keep up the enthusiasm.'
  ),
  (
    'c2000000-0000-0000-0000-000000000002',
    'b4000000-0000-0000-0000-000000000004',
    '2024-01-15',
    2,
    'Worked on setting up the development environment. Installed Node.js, configured VS Code, and cloned the company repository. Began reading through existing codebase.',
    'VS Code, Node.js, Git, GitHub, Terminal, npm',
    'Version control with Git, reading and understanding existing codebases, environment setup',
    'Understanding the existing codebase structure as it was a large project with many files and dependencies.',
    'approved',
    'b3000000-0000-0000-0000-000000000003',
    'Excellent progress on environment setup.'
  ),
  (
    'c3000000-0000-0000-0000-000000000003',
    'b4000000-0000-0000-0000-000000000004',
    '2024-01-22',
    3,
    'Started working on the user authentication module. Implemented JWT-based login and registration endpoints using Express.js and bcrypt for password hashing.',
    'VS Code, Node.js, Express.js, JWT, bcrypt, Postman, PostgreSQL',
    'REST API development, JWT authentication, password security, API testing with Postman',
    'Understanding token refresh mechanisms and handling edge cases in authentication flows.',
    'pending',
    'b3000000-0000-0000-0000-000000000003',
    NULL
  ),
  (
    'c4000000-0000-0000-0000-000000000004',
    'b4000000-0000-0000-0000-000000000004',
    '2024-01-29',
    4,
    'Implemented the database schema for the project using PostgreSQL. Created tables for users, products, and orders with proper foreign key constraints and indexes.',
    'PostgreSQL, pgAdmin, SQL, DBeaver, VS Code',
    'Database design, SQL query writing, understanding foreign key relationships, database indexing',
    'Optimizing complex SQL queries that joined multiple tables and returned large datasets.',
    'draft',
    NULL,
    NULL
  ),
  (
    'c5000000-0000-0000-0000-000000000005',
    'b5000000-0000-0000-0000-000000000005',
    '2024-01-08',
    1,
    'First day at the company. Attended orientation and was introduced to the software development team. Reviewed the company development standards and coding guidelines document thoroughly.',
    'Company documentation, Notion, Slack, Google Meet',
    'Understanding software development lifecycles, team communication, reading technical documentation',
    'Getting familiar with the tools and processes used by the team, especially the project management workflow.',
    'approved',
    'b3000000-0000-0000-0000-000000000003',
    'Good attitude. Welcome to the team!'
  )
ON CONFLICT DO NOTHING;


-- ─── Notifications ────────────────────────────────────────────

INSERT INTO notifications (
  id, user_id, title, message, type, is_read, related_entry_id, related_user_id
) VALUES
  (
    'd1000000-0000-0000-0000-000000000001',
    'b4000000-0000-0000-0000-000000000004',
    'Entry Approved',
    'Your Week 1 entry has been approved by Mr. Babatunde Adeyemi. Comment: Great start! Keep up the enthusiasm.',
    'approval',
    TRUE,
    'c1000000-0000-0000-0000-000000000001',
    'b3000000-0000-0000-0000-000000000003'
  ),
  (
    'd2000000-0000-0000-0000-000000000002',
    'b4000000-0000-0000-0000-000000000004',
    'Entry Approved',
    'Your Week 2 entry has been approved by Mr. Babatunde Adeyemi. Comment: Excellent progress on environment setup.',
    'approval',
    TRUE,
    'c2000000-0000-0000-0000-000000000002',
    'b3000000-0000-0000-0000-000000000003'
  ),
  (
    'd3000000-0000-0000-0000-000000000003',
    'b4000000-0000-0000-0000-000000000004',
    'Entry Submitted',
    'Your Week 3 entry has been submitted and is awaiting supervisor review.',
    'submission',
    FALSE,
    'c3000000-0000-0000-0000-000000000003',
    NULL
  ),
  (
    'd4000000-0000-0000-0000-000000000004',
    'b3000000-0000-0000-0000-000000000003',
    'New Entry Pending Review',
    'Chioma Adaeze Okonkwo has submitted Week 3 entry for your review.',
    'submission',
    FALSE,
    'c3000000-0000-0000-0000-000000000003',
    'b4000000-0000-0000-0000-000000000004'
  )
ON CONFLICT DO NOTHING;