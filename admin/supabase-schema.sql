-- Run this in the Supabase SQL Editor to create the leads table

create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  services text[] not null,
  material text,
  gauge text,
  width text,
  quantity text,
  timeline text,
  details text,
  name text not null,
  company text,
  email text not null,
  phone text,
  status text default 'new' check (status in ('new', 'contacted', 'quoted', 'won', 'lost')),
  source text default 'website',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on leads
  for each row execute function update_updated_at();

-- Index for common queries
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_created on leads(created_at desc);
create index if not exists idx_leads_email on leads(email);

-- Enable RLS (Row Level Security)
alter table leads enable row level security;

-- Allow service role full access (used by the API route)
create policy "Service role has full access"
  on leads for all
  using (true)
  with check (true);
