-- Update the handle_new_user trigger to check allowed_emails and set role
-- Run this in Supabase SQL Editor to update the trigger
--
-- IMPORTANT: This assumes the allowed_emails table has a 'role' column.
-- If you haven't added it yet, run this first:
--   ALTER TABLE public.allowed_emails ADD COLUMN IF NOT EXISTS role text DEFAULT 'teacher';
--
-- This ensures that when a new user signs up, their profile role is set based on
-- the allowed_emails table. If the email is in allowed_emails with role 'admin',
-- they get admin role. Otherwise, they get 'teacher' role.
-- Note: Middleware will still block users not in allowed_emails after signup.

-- Drop the old trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create updated function that checks allowed_emails and sets role
create function public.handle_new_user()
returns trigger as $$
declare
  username text;
  user_role text;
  email_lower text;
begin
  -- Extract username from email
  select substring(new.email from '(.*)@') into username;
  email_lower := lower(new.email);

  -- Check if email exists in allowed_emails and get role
  -- Default to 'teacher' if not found
  select coalesce(role, 'teacher') into user_role
  from public.allowed_emails
  where email = email_lower
  limit 1;

  -- If not in allowed_emails at all, default to 'teacher'
  -- (Middleware will block them if not in allowed_emails)
  if user_role is null then
    user_role := 'teacher';
  end if;

  -- Insert profile with role from allowed_emails (or default 'teacher')
  insert into public.profiles (id, email, display_name, biography, role)
  values (new.id, new.email, username, null, user_role::public.role);

  return new;
end;
$$ language plpgsql security definer;

-- Recreate the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

