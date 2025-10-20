-- Add optional cancel reason to orders
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;
