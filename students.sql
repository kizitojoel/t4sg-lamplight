-- students.sql
-- Lamplight Data Management App — Students table

-- =========
-- ENUM TYPES
-- =========
do $$ begin
  create type public.program_enum as enum ('ESOL', 'HCP');
exception when duplicate_object then null end $$;

do $$ begin
  create type public.enrollment_status_enum as enum ('active', 'inactive');
exception when duplicate_object then null end $$;

-- Course placement options across both programs (plus 'Other')
do $$ begin
  create type public.course_placement_enum as enum (
    -- ESOL
    'ESOL Beginner L1 part 1','ESOL Beginner L1 part 2','ESOL Beginner L1 part 3',
    'ESOL L2 part 1','ESOL L2 part 2','ESOL L2 part 3',
    'ESOL Intermediate part 1','ESOL Intermediate part 2','ESOL Intermediate part 3',
    -- HCP
    'HCP English Pre-TEAS part 1','HCP English Pre-TEAS part 2',
    'HCP English TEAS','HCP Math TEAS',
    -- Other
    'Other'
  );
exception when duplicate_object then null end $$;

-- =====================
-- TIMESTAMP TOUCH FN
-- =====================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================
-- STUDENTS TABLE DEFINITION
-- =========================
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 1) Header / Basic Info
  preferred_name text,                      -- Preferred
  legal_first_name text not null,           -- Legal
  legal_last_name  text not null,           -- Legal
  program program_enum not null,            -- ESOL or HCP
  course_placement course_placement_enum not null,
  enrollment_status enrollment_status_enum not null default 'active',

  -- 2) Contact Information
  phone text,
  email text,
  address_street text,
  address_city text,
  address_state text,
  address_zip text,

  -- 3) Demographics
  gender text,
  age smallint check (age is null or (age >= 0 and age <= 120)),
  ethnicity_hispanic_latino boolean,        -- true if Hispanic/Latino/Latina
  race text[],                               -- multi-select
  country_of_birth text,
  native_language text,
  language_spoken_at_home text,

  -- Admin/meta
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

-- Keep updated_at fresh
drop trigger if exists trg_students_timestamps on public.students;
create trigger trg_students_timestamps
before update on public.students
for each row execute function public.touch_updated_at();

-- Helpful indexes
create index if not exists idx_students_program on public.students (program);
create index if not exists idx_students_enrollment_status on public.students (enrollment_status);
create index if not exists idx_students_last_name on public.students (legal_last_name);
create index if not exists idx_students_email on public.students (email);
create index if not exists idx_students_created_at on public.students (created_at desc);

-- ============
-- RLS POLICIES
-- ============
alter table public.students enable row level security;

-- Read: any authenticated user
drop policy if exists "students_read_authenticated" on public.students;
create policy "students_read_authenticated"
on public.students for select
to authenticated
using (true);

-- Write policies (adjust to your whitelist strategy)
-- Example: domain-based staff writes. Replace with your own rule/table as needed.
drop policy if exists "students_insert_staff" on public.students;
create policy "students_insert_staff"
on public.students for insert
to authenticated
with check (
  exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and (u.email ilike '%@lamplight.org' or u.email ilike '%@partner.org')
  )
);

drop policy if exists "students_update_staff" on public.students;
create policy "students_update_staff"
on public.students for update
to authenticated
using (
  exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and (u.email ilike '%@lamplight.org' or u.email ilike '%@partner.org')
  )
)
with check (true);

drop policy if exists "students_delete_staff" on public.students;
create policy "students_delete_staff"
on public.students for delete
to authenticated
using (
  exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and (u.email ilike '%@lamplight.org' or u.email ilike '%@partner.org')
  )
);

-- Optional: soft uniqueness for emails (many learners may not have one)
-- If you want strict uniqueness when present:
-- alter table public.students add constraint students_email_unique unique (email);
