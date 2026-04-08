-- Onboarding schema additions
-- Run these in the Supabase SQL editor

-- 1. Add onboarding fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS locale TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS sport_type TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS club_code TEXT UNIQUE;

-- 2. Add color to EventType table
ALTER TABLE "EventType" ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#95a5a6';

-- 3. Add granular invite permission to Role table
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS can_invite_players BOOLEAN NOT NULL DEFAULT false;
