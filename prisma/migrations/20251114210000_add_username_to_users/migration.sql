-- AlterTable
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Create unique index for usernames
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Add comment
COMMENT ON COLUMN "User"."username" IS 'Unique username for user login';
