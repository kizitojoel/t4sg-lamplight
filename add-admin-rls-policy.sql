-- Add RLS policy to allow admins to update any profile's role
-- Run this in Supabase SQL Editor

-- Policy to allow admins to update profiles (specifically for role updates)
create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Note: This policy allows any authenticated admin to update any profile.
-- The existing "Users can update own profile" policy still applies,
-- so users can still update their own profiles, and admins can update any profile.

