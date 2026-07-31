-- Allow anonymous and authenticated users to read the demo garage owner's data.
-- Demo owner: yoxtrot@gmail.com (a68629f5-a927-4b7e-b593-53b4d7ac8697)
-- Insert/update/delete remain owner-only so demo mode is read-only at the DB layer.

create policy "Public can select demo vehicles"
  on public.vehicles
  for select
  to anon, authenticated
  using (user_id = 'a68629f5-a927-4b7e-b593-53b4d7ac8697'::uuid);

create policy "Public can select demo vehicle projects"
  on public.vehicle_projects
  for select
  to anon, authenticated
  using (user_id = 'a68629f5-a927-4b7e-b593-53b4d7ac8697'::uuid);

create policy "Public can select demo maintenance"
  on public.maintenance_records
  for select
  to anon, authenticated
  using (user_id = 'a68629f5-a927-4b7e-b593-53b4d7ac8697'::uuid);

create policy "Public can select demo research"
  on public.fix_research_notes
  for select
  to anon, authenticated
  using (user_id = 'a68629f5-a927-4b7e-b593-53b4d7ac8697'::uuid);
