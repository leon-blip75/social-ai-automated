create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null unique,
  description text,
  audience text,
  tone_of_voice text,
  offer text,
  cta text,
  created_at timestamptz default now()
);

create table social_accounts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  platform text not null check (platform in ('linkedin','facebook','instagram')),
  account_name text,
  account_external_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  enabled boolean default true,
  created_at timestamptz default now()
);

create table post_ideas (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  topic text not null,
  goal text default 'leads',
  status text default 'new' check (status in ('new','generated','sent_for_approval','approved','rejected','published','failed')),
  created_at timestamptz default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  idea_id uuid references post_ideas(id) on delete set null,
  platform text not null check (platform in ('linkedin','facebook','instagram')),
  caption text not null,
  hashtags text[] default '{}',
  image_prompt text,
  image_url text,
  status text default 'draft' check (status in ('draft','approval_requested','approved','rejected','published','failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  external_post_id text,
  schedule_id uuid,
  error text,
  created_at timestamptz default now()
);

create table approval_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  channel text default 'telegram',
  message_id text,
  action text,
  payload jsonb,
  created_at timestamptz default now()
);


create table schedules (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  name text not null,
  timezone text not null default 'Europe/Amsterdam',
  times text[] not null default array['07:00'],
  days_of_week int[] not null default array[1,2,3,4,5,6,0],
  platforms text[] not null default array['linkedin','facebook','instagram'],
  topics text[] not null default array['Geef een praktische tip die aansluit bij de doelgroep en verwijs subtiel naar de CTA.'],
  active boolean default true,
  auto_publish boolean default false,
  last_triggered_at timestamptz,
  last_triggered_key text,
  created_at timestamptz default now()
);

alter table posts
  add constraint posts_schedule_id_fkey
  foreign key (schedule_id) references schedules(id) on delete set null;
