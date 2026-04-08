-- Enable vector extension for embeddings
create extension if not exists vector with schema extensions;

-- Table for comment embeddings
create table if not exists public.rag_comment_chunks (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  content text not null,
  sentimenttype text,
  embedding vector(384) not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (comment_id)
);

alter table public.rag_comment_chunks enable row level security;

-- Table for chat sessions
create table if not exists public.rag_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.rag_chat_sessions enable row level security;

-- Table for chat messages
create table if not exists public.rag_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.rag_chat_sessions(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  created_at timestamp with time zone not null default now()
);

alter table public.rag_chat_messages enable row level security;

-- Updated_at triggers
drop trigger if exists update_rag_comment_chunks_updated_at on public.rag_comment_chunks;
create trigger update_rag_comment_chunks_updated_at
  before update on public.rag_comment_chunks
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists update_rag_chat_sessions_updated_at on public.rag_chat_sessions;
create trigger update_rag_chat_sessions_updated_at
  before update on public.rag_chat_sessions
  for each row
  execute function public.update_updated_at_column();

-- Indexes for retrieval
create index if not exists rag_comment_chunks_consultation_idx
  on public.rag_comment_chunks (consultation_id);

create index if not exists rag_comment_chunks_embedding_idx
  on public.rag_comment_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- RPC for vector search
create or replace function public.match_comment_chunks(
  query_embedding vector(384),
  match_count int,
  filter_consultation_id uuid,
  filter_sentiment text default null
)
returns table (
  id uuid,
  comment_id uuid,
  consultation_id uuid,
  content text,
  sentimenttype text,
  similarity float
)
language plpgsql
as $$
begin
  return query
    select
      c.id,
      c.comment_id,
      c.consultation_id,
      c.content,
      c.sentimenttype,
      1 - (c.embedding <=> query_embedding) as similarity
    from public.rag_comment_chunks c
    where c.consultation_id = filter_consultation_id
      and (filter_sentiment is null or c.sentimenttype = filter_sentiment)
    order by c.embedding <=> query_embedding
    limit match_count;
end;
$$;
