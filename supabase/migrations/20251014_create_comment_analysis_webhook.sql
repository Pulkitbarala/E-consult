-- Supabase webhook to analyze every new comment
-- Replace <project-ref> with your actual Supabase project ref

create or replace function public.trigger_analyze_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  operation_type text;
  comment_id_to_analyze uuid;
begin
  -- Determine operation type for debugging
  operation_type := TG_OP;
  comment_id_to_analyze := NEW.id;
  
  -- For UPDATE operations, only analyze if content actually changed
  if operation_type = 'UPDATE' then
    if OLD.content = NEW.content then
      return NEW; -- No change in content, skip analysis
    end if;
  end if;
  
  -- Always notify first to confirm trigger fires
  perform pg_notify('analyze_comment_trigger', operation_type || ':' || comment_id_to_analyze::text || ':' || NEW.content);
  
  -- Use PERFORM so errors in http_post do not block insert/update
  begin
    perform
      net.http_post(
        'https://kylrkuwujlvankuwqqdc.functions.supabase.co/analyze-comment',
        json_build_object('comment_id', comment_id_to_analyze)::text,
        'application/json'
      );
    -- Notify success
    perform pg_notify('analyze_comment_success', operation_type || ':' || comment_id_to_analyze::text);
  exception when others then
    -- Log the error but don't block the operation
    perform pg_notify('analyze_comment_error', operation_type || ':' || comment_id_to_analyze::text || ':' || SQLERRM);
  end;
  return NEW;
end;
$$;

-- Drop existing triggers if present
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'analyze_comment_after_insert'
  ) THEN
    DROP TRIGGER analyze_comment_after_insert ON public.comments;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'analyze_comment_after_update'
  ) THEN
    DROP TRIGGER analyze_comment_after_update ON public.comments;
  END IF;
END $$;

create trigger analyze_comment_after_insert
  after insert on public.comments
  for each row
  execute function public.trigger_analyze_comment();

create trigger analyze_comment_after_update
  after update on public.comments
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

-- Allow authenticated users to update their own comments
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'Users can update own comments' and tablename = 'comments'
  ) then
    create policy "Users can update own comments"
      on public.comments
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
