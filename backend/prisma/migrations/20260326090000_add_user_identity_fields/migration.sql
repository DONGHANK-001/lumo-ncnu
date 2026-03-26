-- Add identity fields for trust & safety profile
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');

ALTER TABLE "users"
ADD COLUMN "gender" "Gender",
ADD COLUMN "gradeLabel" TEXT;
