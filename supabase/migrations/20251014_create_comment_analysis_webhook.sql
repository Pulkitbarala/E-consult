-- Supabase webhook to analyze every new comment
-- Replace <project-ref> with your actual Supabase project ref

create or replace function public.trigger_analyze_comment()
returns trigger as $$
begin
  -- Use PERFORM so errors in http_post do not block insert
  begin
    perform
      net.http_post(
        'https://kylrkuwujlvankuwqqdc.functions.supabase.co/analyze-comment',
        json_build_object('comment_id', new.id)::text,
        'application/json'
      );
    -- Debug: notify that trigger ran
    perform pg_notify('analyze_comment_trigger', new.id::text);
  exception when others then
    -- swallow any errors from http_post
    null;
  end;
  return new;
end;
$$ language plpgsql;

-- Drop existing trigger if present
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'analyze_comment_after_insert'
  ) THEN
    DROP TRIGGER analyze_comment_after_insert ON public.comments;
  END IF;
END $$;

create trigger analyze_comment_after_insert
  after insert on public.comments
  for each row
  execute function public.trigger_analyze_comment();
-- Enable RLS on comments table
alter table public.comments enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'Authenticated users can insert comments' and tablename = 'comments'
  ) then
    create policy "Authenticated users can insert comments"
      on public.comments
      for insert
      with check (auth.role() = 'authenticated');
  end if;
end $$;
