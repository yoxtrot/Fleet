-- Vehicle photos: path column + private-to-owner storage bucket

alter table public.vehicles
  add column if not exists photo_path text;

insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Users can select own vehicle photos" on storage.objects;
drop policy if exists "Users can upload own vehicle photos" on storage.objects;
drop policy if exists "Users can update own vehicle photos" on storage.objects;
drop policy if exists "Users can delete own vehicle photos" on storage.objects;
drop policy if exists "Public can view vehicle photos" on storage.objects;

create policy "Public can view vehicle photos"
  on storage.objects for select
  using (bucket_id = 'vehicle-photos');

create policy "Users can upload own vehicle photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'vehicle-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own vehicle photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'vehicle-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'vehicle-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own vehicle photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'vehicle-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
