-- Add column to UserProfile
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3);

-- Create PhoneVerificationToken table
CREATE TABLE IF NOT EXISTS "PhoneVerificationToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PhoneVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PhoneVerificationToken_userId_idx" ON "PhoneVerificationToken" ("userId");
CREATE INDEX IF NOT EXISTS "PhoneVerificationToken_expiresAt_idx" ON "PhoneVerificationToken" ("expiresAt");
CREATE INDEX IF NOT EXISTS "PhoneVerificationToken_userId_phone_usedAt_idx" ON "PhoneVerificationToken" ("userId", "phone", "usedAt");

ALTER TABLE "PhoneVerificationToken"
  ADD CONSTRAINT "PhoneVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


