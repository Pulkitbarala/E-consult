-- Add UPDATE trigger to re-run analysis when a comment's content changes

-- Ensure the trigger function is up to date
create or replace function public.trigger_analyze_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  operation_type text;
  comment_id_to_analyze text;
begin
  operation_type := TG_OP;
  comment_id_to_analyze := NEW.id::text;

  -- For UPDATE operations, only analyze if content actually changed
  if operation_type = 'UPDATE' then
    if OLD.content is not distinct from NEW.content then
      return NEW; -- No change in content, skip analysis
    end if;
  end if;

  -- Fire webhook; do not block on errors
  begin
    perform
      net.http_post(
        'https://kylrkuwujlvankuwqqdc.functions.supabase.co/analyze-comment',
        json_build_object('comment_id', NEW.id)::text,
        'application/json'
      );
    perform pg_notify('analyze_comment_trigger', operation_type || ':' || comment_id_to_analyze);
  exception when others then
    perform pg_notify('analyze_comment_error', operation_type || ':' || comment_id_to_analyze || ':' || SQLERRM);
  end;
  return NEW;
end;
$$;

-- Drop and recreate the UPDATE trigger
do $$
begin
  if exists (
    select 1 from pg_trigger where tgname = 'analyze_comment_after_update'
  ) then
    drop trigger analyze_comment_after_update on public.comments;
  end if;

  create trigger analyze_comment_after_update
    after update of content on public.comments
    for each row
    when (old.content is distinct from new.content)
    execute function public.trigger_analyze_comment();
end $$;
