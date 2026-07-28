-- Vehicle projects: planned work with images and parts links

create table if not exists public.vehicle_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  title text not null,
  description text,
  image_paths text[] not null default '{}',
  part_links text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicle_projects_user_id_idx on public.vehicle_projects (user_id);
create index if not exists vehicle_projects_vehicle_id_idx on public.vehicle_projects (vehicle_id);

alter table public.vehicle_projects enable row level security;

drop policy if exists "Users can select own vehicle projects" on public.vehicle_projects;
drop policy if exists "Users can insert own vehicle projects" on public.vehicle_projects;
drop policy if exists "Users can update own vehicle projects" on public.vehicle_projects;
drop policy if exists "Users can delete own vehicle projects" on public.vehicle_projects;

create policy "Users can select own vehicle projects"
  on public.vehicle_projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own vehicle projects"
  on public.vehicle_projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own vehicle projects"
  on public.vehicle_projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own vehicle projects"
  on public.vehicle_projects for delete
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can view project images" on storage.objects;
drop policy if exists "Users can upload own project images" on storage.objects;
drop policy if exists "Users can update own project images" on storage.objects;
drop policy if exists "Users can delete own project images" on storage.objects;

create policy "Public can view project images"
  on storage.objects for select
  using (bucket_id = 'project-images');

create policy "Users can upload own project images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own project images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own project images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
