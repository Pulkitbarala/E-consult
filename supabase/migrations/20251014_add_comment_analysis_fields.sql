-- Add sentiment analysis fields to comments
-- This migration adds three columns to store analysis results for each comment.

alter table if exists public.comments
  add column if not exists sentimenttype text;

alter table if exists public.comments
  add column if not exists score numeric;

alter table if exists public.comments
  add column if not exists keyword text;

-- Optional: basic check constraints could be added later (e.g., score between 0 and 1)
