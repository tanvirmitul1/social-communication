-- Migration: Add 2FA fields to users + create user_settings table

-- Two-Factor Authentication fields
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "twoFactorSecret" VARCHAR(255);

-- User Settings table
CREATE TABLE IF NOT EXISTS "user_settings" (
  "id"                   VARCHAR(36)  NOT NULL,
  "userId"               VARCHAR(36)  NOT NULL,
  "notifyMessages"       BOOLEAN      NOT NULL DEFAULT TRUE,
  "notifyMentions"       BOOLEAN      NOT NULL DEFAULT TRUE,
  "notifyReactions"      BOOLEAN      NOT NULL DEFAULT TRUE,
  "notifyFriendRequests" BOOLEAN      NOT NULL DEFAULT TRUE,
  "notifyCalls"          BOOLEAN      NOT NULL DEFAULT TRUE,
  "showOnlineStatus"     BOOLEAN      NOT NULL DEFAULT TRUE,
  "allowFriendRequests"  BOOLEAN      NOT NULL DEFAULT TRUE,
  "theme"                VARCHAR(20)  NOT NULL DEFAULT 'system',
  "language"             VARCHAR(10)  NOT NULL DEFAULT 'en',
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one settings row per user
ALTER TABLE "user_settings"
  ADD CONSTRAINT "user_settings_userId_key" UNIQUE ("userId");

-- FK to users
ALTER TABLE "user_settings"
  ADD CONSTRAINT "user_settings_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
