-- SQL migration: create a function to fetch feed consultations excluding ones the user commented on
-- Usage: select * from public.get_feed_consultations('user-uuid', 1, 20);

create or replace function public.get_feed_consultations(
  p_user_id uuid,
  p_page int default 1,
  p_page_size int default 20
)
returns table(
  id uuid,
  title text,
  description text,
  category text,
  expires_at timestamptz,
  created_at timestamptz,
  user_id uuid,
  comment_count int
)
language sql
stable
as $$
with user_commented as (
  select distinct consultation_id
  from public.comments
  where user_id = p_user_id
),
consultations_filtered as (
  select c.*
  from public.consultations c
  where c.expires_at > now()
    and c.id not in (select consultation_id from user_commented)
),
counts as (
  select consultation_id, count(*) as cnt
  from public.comments
  where consultation_id in (select id from consultations_filtered)
  group by consultation_id
),
paged as (
  select cf.*, coalesce(cnt, 0) as comment_count
  from consultations_filtered cf
  left join counts on counts.consultation_id = cf.id
  order by created_at desc
  offset (p_page - 1) * p_page_size
  limit p_page_size
)
select id, title, description, category, expires_at, created_at, user_id, comment_count
from paged;
$$;

-- create an index to speed up comment lookups if not already present
create index if not exists idx_comments_consultation_id on public.comments (consultation_id);
create index if not exists idx_consultations_expires_at on public.consultations (expires_at);
