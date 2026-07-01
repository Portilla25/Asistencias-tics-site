create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  create type public.user_role as enum ('admin', 'docente', 'alumno');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.student_status as enum ('activo', 'retirado');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.attendance_status as enum ('presente', 'ausente', 'tardanza', 'justificado');
exception when duplicate_object then null;
end $$;

create table if not exists public.app_admin_emails (
  email citext primary key,
  created_at timestamptz not null default now()
);

insert into public.app_admin_emails (email)
values ('fer250423@gmail.com')
on conflict (email) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  role public.user_role not null default 'alumno',
  student_id text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.careers (
  id text primary key,
  name text not null,
  icon text,
  color text,
  sort_order integer not null default 0,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modules (
  id text primary key,
  career_id text references public.careers(id) on delete set null,
  label text not null,
  badge text,
  name text not null,
  code text not null,
  teacher_id text,
  description text,
  color text,
  hidden boolean not null default false,
  sort_order integer not null default 0,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id text primary key,
  first_name text not null default '',
  last_name text not null default '',
  full_name text not null,
  email citext,
  dni text,
  phone text,
  course text,
  status public.student_status not null default 'activo',
  source text not null default 'firebase_legacy',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_modules (
  student_id text not null references public.students(id) on delete cascade,
  module_id text not null references public.modules(id) on delete cascade,
  legacy_student_id text not null,
  status public.student_status not null default 'activo',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (student_id, module_id),
  unique (module_id, legacy_student_id)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  module_id text not null references public.modules(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  fecha date not null,
  status public.attendance_status not null,
  observation text,
  registered_by text,
  legacy_student_id text,
  raw_status text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, student_id, fecha)
);

create index if not exists attendance_module_fecha_idx on public.attendance (module_id, fecha);
create index if not exists attendance_student_fecha_idx on public.attendance (student_id, fecha);

create table if not exists public.class_sessions (
  module_id text not null references public.modules(id) on delete cascade,
  fecha date not null,
  class_number integer,
  topic text,
  modality text,
  hours numeric(6,2),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (module_id, fecha)
);

create table if not exists public.grades (
  module_id text not null references public.modules(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  nota1 numeric(5,2),
  nota2 numeric(5,2),
  nota3 numeric(5,2),
  promedio_final numeric(5,2),
  puntos_extra integer not null default 0,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (module_id, student_id)
);

create table if not exists public.custom_students (
  id text primary key,
  name text not null,
  phone text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_classes (
  id uuid primary key default gen_random_uuid(),
  custom_student_id text not null references public.custom_students(id) on delete cascade,
  fecha date not null,
  status text not null default 'Presente',
  hours numeric(6,2) not null default 0,
  start_time time,
  end_time time,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (custom_student_id, fecha, start_time, end_time)
);

create table if not exists public.legacy_raw_modules (
  module_id text primary key,
  raw jsonb not null,
  imported_at timestamptz not null default now()
);

create table if not exists public.migration_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_hash text,
  counts jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_careers_updated_at on public.careers;
create trigger touch_careers_updated_at before update on public.careers
for each row execute function public.touch_updated_at();

drop trigger if exists touch_modules_updated_at on public.modules;
create trigger touch_modules_updated_at before update on public.modules
for each row execute function public.touch_updated_at();

drop trigger if exists touch_students_updated_at on public.students;
create trigger touch_students_updated_at before update on public.students
for each row execute function public.touch_updated_at();

drop trigger if exists touch_student_modules_updated_at on public.student_modules;
create trigger touch_student_modules_updated_at before update on public.student_modules
for each row execute function public.touch_updated_at();

drop trigger if exists touch_attendance_updated_at on public.attendance;
create trigger touch_attendance_updated_at before update on public.attendance
for each row execute function public.touch_updated_at();

drop trigger if exists touch_class_sessions_updated_at on public.class_sessions;
create trigger touch_class_sessions_updated_at before update on public.class_sessions
for each row execute function public.touch_updated_at();

drop trigger if exists touch_grades_updated_at on public.grades;
create trigger touch_grades_updated_at before update on public.grades
for each row execute function public.touch_updated_at();

drop trigger if exists touch_custom_students_updated_at on public.custom_students;
create trigger touch_custom_students_updated_at before update on public.custom_students
for each row execute function public.touch_updated_at();

drop trigger if exists touch_custom_classes_updated_at on public.custom_classes;
create trigger touch_custom_classes_updated_at before update on public.custom_classes
for each row execute function public.touch_updated_at();

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'docente')
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email citext := new.email;
  matched_student_id text;
  assigned_role public.user_role := 'alumno';
begin
  if exists (select 1 from public.app_admin_emails where email = user_email) then
    assigned_role := 'admin';
  else
    select id into matched_student_id
    from public.students
    where email = user_email
    order by status asc, full_name asc
    limit 1;
  end if;

  insert into public.profiles (id, email, role, student_id, display_name)
  values (
    new.id,
    user_email,
    assigned_role,
    matched_student_id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', user_email::text)
  )
  on conflict (id) do update set
    email = excluded.email,
    role = case
      when exists (select 1 from public.app_admin_emails where email = excluded.email) then 'admin'::public.user_role
      else public.profiles.role
    end,
    student_id = coalesce(public.profiles.student_id, excluded.student_id),
    display_name = excluded.display_name,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update on auth.users
for each row execute function public.handle_new_user();

alter table public.app_admin_emails enable row level security;
alter table public.profiles enable row level security;
alter table public.careers enable row level security;
alter table public.modules enable row level security;
alter table public.students enable row level security;
alter table public.student_modules enable row level security;
alter table public.attendance enable row level security;
alter table public.class_sessions enable row level security;
alter table public.grades enable row level security;
alter table public.custom_students enable row level security;
alter table public.custom_classes enable row level security;
alter table public.legacy_raw_modules enable row level security;
alter table public.migration_runs enable row level security;

drop policy if exists "staff can manage admin emails" on public.app_admin_emails;
create policy "staff can manage admin emails" on public.app_admin_emails
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_staff());

drop policy if exists "staff can manage profiles" on public.profiles;
create policy "staff can manage profiles" on public.profiles
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff can manage careers" on public.careers;
create policy "staff can manage careers" on public.careers
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "authenticated can read careers" on public.careers;
create policy "authenticated can read careers" on public.careers
for select to authenticated using (true);

drop policy if exists "staff can manage modules" on public.modules;
create policy "staff can manage modules" on public.modules
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "authenticated can read modules" on public.modules;
create policy "authenticated can read modules" on public.modules
for select to authenticated using (true);

drop policy if exists "staff can manage students" on public.students;
create policy "staff can manage students" on public.students
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "students can read own student row" on public.students;
create policy "students can read own student row" on public.students
for select to authenticated using (
  public.is_staff()
  or id = (select student_id from public.profiles where profiles.id = auth.uid())
);

drop policy if exists "staff can manage student modules" on public.student_modules;
create policy "staff can manage student modules" on public.student_modules
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "students can read own module links" on public.student_modules;
create policy "students can read own module links" on public.student_modules
for select to authenticated using (
  public.is_staff()
  or student_id = (select student_id from public.profiles where profiles.id = auth.uid())
);

drop policy if exists "staff can manage attendance" on public.attendance;
create policy "staff can manage attendance" on public.attendance
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "students can read own attendance" on public.attendance;
create policy "students can read own attendance" on public.attendance
for select to authenticated using (
  public.is_staff()
  or student_id = (select student_id from public.profiles where profiles.id = auth.uid())
);

drop policy if exists "staff can manage sessions" on public.class_sessions;
create policy "staff can manage sessions" on public.class_sessions
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "authenticated can read sessions" on public.class_sessions;
create policy "authenticated can read sessions" on public.class_sessions
for select to authenticated using (true);

drop policy if exists "staff can manage grades" on public.grades;
create policy "staff can manage grades" on public.grades
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "students can read own grades" on public.grades;
create policy "students can read own grades" on public.grades
for select to authenticated using (
  public.is_staff()
  or student_id = (select student_id from public.profiles where profiles.id = auth.uid())
);

drop policy if exists "staff can manage custom students" on public.custom_students;
create policy "staff can manage custom students" on public.custom_students
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff can manage custom classes" on public.custom_classes;
create policy "staff can manage custom classes" on public.custom_classes
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff can read raw modules" on public.legacy_raw_modules;
create policy "staff can read raw modules" on public.legacy_raw_modules
for select to authenticated using (public.is_staff());

drop policy if exists "staff can read migration runs" on public.migration_runs;
create policy "staff can read migration runs" on public.migration_runs
for select to authenticated using (public.is_staff());
