-- PTP Operations Suite — Full Database Schema
-- Run this in the Supabase SQL Editor

-- =============================================
-- UTILITY: Auto-update updated_at trigger
-- =============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =============================================
-- LEADS (website quote requests + manual entry)
-- =============================================
create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  company text,
  email text not null,
  phone text,
  services text[] not null,
  material text,
  gauge text,
  width text,
  quantity text,
  timeline text,
  details text,
  status text default 'new' check (status in ('new', 'contacted', 'quoted', 'negotiating', 'won', 'lost')),
  source text default 'website',
  assigned_to text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger leads_updated_at before update on leads
  for each row execute function update_updated_at();

create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_created on leads(created_at desc);
create index if not exists idx_leads_email on leads(email);

-- =============================================
-- ACCOUNTS (target companies / CRM)
-- =============================================
create table if not exists accounts (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  sector text,
  location text,
  priority text default 'medium' check (priority in ('critical', 'high', 'medium', 'low')),
  needs text,
  steel_types text,
  website text,
  linkedin text,
  phone text,
  revenue text,
  employees text,
  founded text,
  ticker text,
  description text,
  social_links jsonb default '{}',
  pipeline_stage text default 'awareness' check (pipeline_stage in ('awareness', 'engagement', 'consideration', 'proposal', 'closed')),
  est_deal_value text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger accounts_updated_at before update on accounts
  for each row execute function update_updated_at();

create index if not exists idx_accounts_slug on accounts(slug);
create index if not exists idx_accounts_stage on accounts(pipeline_stage);
create index if not exists idx_accounts_priority on accounts(priority);

-- =============================================
-- CONTACTS (people at target companies)
-- =============================================
create table if not exists contacts (
  id uuid default gen_random_uuid() primary key,
  account_id uuid references accounts(id) on delete cascade,
  name text not null,
  title text,
  email text,
  phone text,
  linkedin text,
  birthday text,
  is_primary boolean default false,
  level text check (level in ('executive', 'vp', 'director', 'manager', 'coordinator', 'analyst', 'other')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger contacts_updated_at before update on contacts
  for each row execute function update_updated_at();

create index if not exists idx_contacts_account on contacts(account_id);

-- =============================================
-- ACTIVITY LOG (touches, calls, meetings)
-- =============================================
create table if not exists activity_log (
  id uuid default gen_random_uuid() primary key,
  account_id uuid references accounts(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  ticket_id uuid,
  type text not null check (type in ('call', 'email', 'linkedin', 'meeting', 'research', 'note', 'proposal', 'site-visit', 'trade-show')),
  note text,
  who text,
  created_at timestamptz default now()
);

create index if not exists idx_activity_account on activity_log(account_id);
create index if not exists idx_activity_created on activity_log(created_at desc);
create index if not exists idx_activity_type on activity_log(type);

-- =============================================
-- TICKETS (tasks, follow-ups, escalations)
-- =============================================
create table if not exists tickets (
  id uuid default gen_random_uuid() primary key,
  ticket_number text unique not null,
  title text not null,
  description text,
  type text default 'task' check (type in ('task', 'bug', 'feature', 'question', 'escalation', 'follow-up', 'outreach')),
  priority text default 'medium' check (priority in ('critical', 'high', 'medium', 'low')),
  status text default 'open' check (status in ('open', 'in-progress', 'waiting', 'review', 'resolved', 'closed')),
  assignee text,
  reporter text,
  watchers text[] default '{}',
  labels text[] default '{}',
  account_id uuid references accounts(id) on delete set null,
  due_date date,
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger tickets_updated_at before update on tickets
  for each row execute function update_updated_at();

create index if not exists idx_tickets_status on tickets(status);
create index if not exists idx_tickets_assignee on tickets(assignee);
create index if not exists idx_tickets_priority on tickets(priority);
create index if not exists idx_tickets_due on tickets(due_date);
create index if not exists idx_tickets_number on tickets(ticket_number);

-- =============================================
-- TICKET COMMENTS (activity on tickets)
-- =============================================
create table if not exists ticket_comments (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references tickets(id) on delete cascade not null,
  author text not null,
  content text not null,
  is_system boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_comments_ticket on ticket_comments(ticket_id);
create index if not exists idx_comments_created on ticket_comments(created_at);

-- =============================================
-- COMPETITORS
-- =============================================
create table if not exists competitors (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  location text,
  type text,
  threat text default 'medium' check (threat in ('high', 'medium', 'low')),
  website text,
  linkedin text,
  social_links jsonb default '{}',
  ticker text,
  revenue text,
  employees text,
  founded text,
  description text,
  strengths text,
  weaknesses text,
  services text[] default '{}',
  key_differentiator text,
  overlap_accounts text[] default '{}',
  digital_presence jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger competitors_updated_at before update on competitors
  for each row execute function update_updated_at();

-- =============================================
-- NOTES (universal notes on any entity)
-- =============================================
create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  entity_type text not null check (entity_type in ('account', 'contact', 'ticket', 'competitor', 'lead')),
  entity_id uuid not null,
  content text not null,
  author text,
  pinned boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_notes_entity on notes(entity_type, entity_id);

-- =============================================
-- TEAM MEMBERS
-- =============================================
create table if not exists team_members (
  id text primary key,
  name text not null,
  email text unique not null,
  role text,
  avatar_url text,
  initials text,
  color text default 'primary',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Seed team members
insert into team_members (id, name, email, role, initials, color) values
  ('jeff', 'Jeff Zielinski', 'jeff@pacifictoll.com', 'Admin / CMO', 'JZ', 'primary'),
  ('mark', 'Mark Proner', 'mproner@pacifictoll.com', 'Owner / President', 'MP', 'success'),
  ('rose', 'Rose', 'rose@pacifictoll.com', 'Operations', 'RO', 'warning')
on conflict (id) do nothing;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table leads enable row level security;
alter table accounts enable row level security;
alter table contacts enable row level security;
alter table activity_log enable row level security;
alter table tickets enable row level security;
alter table ticket_comments enable row level security;
alter table competitors enable row level security;
alter table notes enable row level security;
alter table team_members enable row level security;

create policy "Service role full access" on leads for all using (true) with check (true);
create policy "Service role full access" on accounts for all using (true) with check (true);
create policy "Service role full access" on contacts for all using (true) with check (true);
create policy "Service role full access" on activity_log for all using (true) with check (true);
create policy "Service role full access" on tickets for all using (true) with check (true);
create policy "Service role full access" on ticket_comments for all using (true) with check (true);
create policy "Service role full access" on competitors for all using (true) with check (true);
create policy "Service role full access" on notes for all using (true) with check (true);
create policy "Service role full access" on team_members for all using (true) with check (true);
