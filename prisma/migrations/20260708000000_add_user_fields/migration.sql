-- Add missing User fields for user management and approval functionality
-- This migration adds: status, email, emailVerified, emailVerifiedAt, lastLogin

-- Add UserStatus enum
CREATE TYPE "UserStatus" AS ENUM ('pending', 'active', 'suspended', 'deleted');

-- Add missing columns to User table
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "User" ADD COLUMN "email" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "lastLogin" TIMESTAMP(3);

-- Add index on status for faster queries
CREATE INDEX "User_status_idx" ON "User"("status");
