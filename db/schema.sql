create extension if not exists "uuid-ossp";

create table if not exists brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  domain text not null,
  audience text,
  tone text,
  cta text,
  created_at timestamptz not null default now()
);

create table if not exists social_accounts (
  id uuid primary key default uuid_generate_v4(),
  brand_id uuid not null references brands(id) on delete cascade,
  platform text not null check (platform in ('linkedin', 'facebook', 'instagram')),
  display_name text,
  external_page_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists schedules (
  id uuid primary key default uuid_generate_v4(),
  brand_id uuid not null references brands(id) on delete cascade,
  name text not null,
  timezone text not null default 'Europe/Amsterdam',
  times text[] not null default '{}',
  days_of_week int[] not null default '{1,2,3,4,5,6,0}',
  platforms text[] not null default '{linkedin,facebook,instagram}',
  topic_prompts text[] not null default '{}',
  is_active boolean not null default true,
  last_run_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists post_drafts (
  id uuid primary key default uuid_generate_v4(),
  brand_id uuid not null references brands(id) on delete cascade,
  schedule_id uuid references schedules(id) on delete set null,
  topic text not null,
  platforms text[] not null default '{}',
  text text not null,
  image_prompt text,
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'approved', 'rejected', 'published', 'publish_failed')),
  publish_result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_post_drafts_brand_id on post_drafts(brand_id);
create index if not exists idx_schedules_brand_id on schedules(brand_id);

-- Create a public Supabase Storage bucket named: social-images
