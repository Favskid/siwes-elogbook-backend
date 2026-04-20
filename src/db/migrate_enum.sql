-- Migration script to update user_role enum from 4 values to 3 values
-- This approach converts the column to text, migrates data, then back to enum

BEGIN;

-- Step 1: Drop all constraints that reference the user_role enum
ALTER TABLE users DROP CONSTRAINT IF EXISTS industry_sup_requires_company;
ALTER TABLE users DROP CONSTRAINT IF EXISTS school_sup_requires_department;
ALTER TABLE users DROP CONSTRAINT IF EXISTS student_requires_matric;
ALTER TABLE users DROP CONSTRAINT IF EXISTS student_requires_department;

-- Step 2: Alter the role column to accept text temporarily
ALTER TABLE users ALTER COLUMN role TYPE character varying;

-- Step 3: Migrate old role values to new ones
UPDATE users SET role = 'supervisor' WHERE role IN ('industry_supervisor', 'school_supervisor');

-- Step 4: Drop the old enum
DROP TYPE user_role CASCADE;

-- Step 5: Create the new enum type
CREATE TYPE user_role AS ENUM (
  'student',
  'supervisor',
  'admin'
);

-- Step 6: Convert column back to use the new enum using CAST
ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role;

-- Step 7: Add back the constraints for the new roles
ALTER TABLE users ADD CONSTRAINT student_requires_matric
  CHECK ((role)::text <> 'student' OR matric_number IS NOT NULL);

ALTER TABLE users ADD CONSTRAINT student_requires_department
  CHECK ((role)::text <> 'student' OR department IS NOT NULL);

ALTER TABLE users ADD CONSTRAINT supervisor_requires_department
  CHECK ((role)::text <> 'supervisor' OR department IS NOT NULL);

COMMIT;
