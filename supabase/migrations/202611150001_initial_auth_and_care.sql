begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  role text not null check (role in ('elderly', 'family', 'caretaker', 'volunteer')),
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now()
);
create table public.elder_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  created_at timestamptz not null default now()
);
create table public.care_memberships (
  id uuid primary key default gen_random_uuid(),
  elder_profile_id uuid not null references public.elder_profiles(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('family', 'caretaker')),
  created_at timestamptz not null default now(),
  unique (elder_profile_id, member_id)
);
create index care_memberships_member_idx on public.care_memberships(member_id);
create table public.care_invites (
  id uuid primary key default gen_random_uuid(),
  elder_profile_id uuid not null references public.elder_profiles(id) on delete cascade,
  code_hash text not null unique check (char_length(code_hash) = 64),
  role text not null check (role in ('family', 'caretaker')),
  expires_at timestamptz not null default now() + interval '24 hours',
  used_at timestamptz,
  used_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index care_invites_elder_idx on public.care_invites(elder_profile_id);

-- Helpers run with fixed search paths and never accept an arbitrary acting user.
create function public.owns_elder(target_elder uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.elder_profiles where id = target_elder and owner_id = (select auth.uid()));
$$;
create function public.can_access_elder(target_elder uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.owns_elder(target_elder) or exists (
    select 1 from public.care_memberships where elder_profile_id = target_elder and member_id = (select auth.uid())
  );
$$;

alter table public.profiles enable row level security;
alter table public.elder_profiles enable row level security;
alter table public.care_memberships enable row level security;
alter table public.care_invites enable row level security;

-- Remove default Supabase grants. Changes are exposed only through narrowly scoped RPCs.
revoke all on public.profiles, public.elder_profiles, public.care_memberships, public.care_invites from anon, authenticated;
grant select on public.profiles, public.elder_profiles, public.care_memberships, public.care_invites to authenticated;
grant delete on public.care_memberships, public.care_invites to authenticated;
create policy profiles_self_read on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy elders_authorized_read on public.elder_profiles for select to authenticated using (public.can_access_elder(id));
create policy memberships_read on public.care_memberships for select to authenticated
  using (member_id = (select auth.uid()) or public.owns_elder(elder_profile_id));
create policy memberships_owner_revoke on public.care_memberships for delete to authenticated using (public.owns_elder(elder_profile_id));
create policy invites_owner_read on public.care_invites for select to authenticated using (public.owns_elder(elder_profile_id));
create policy invites_owner_revoke on public.care_invites for delete to authenticated using (public.owns_elder(elder_profile_id));

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  chosen_role text := new.raw_user_meta_data ->> 'role';
  chosen_name text := btrim(new.raw_user_meta_data ->> 'display_name');
begin
  if chosen_role is null or chosen_role not in ('elderly', 'family', 'caretaker') then
    raise exception 'Choose a supported account role';
  end if;
  if chosen_name is null or char_length(chosen_name) not between 2 and 80 then
    raise exception 'A display name of 2 to 80 characters is required';
  end if;
  insert into public.profiles (id, display_name, role) values (new.id, chosen_name, chosen_role);
  if chosen_role = 'elderly' then
    insert into public.elder_profiles (owner_id, display_name) values (new.id, chosen_name);
  end if;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.create_care_invite(target_elder uuid, invited_role text) returns text
language plpgsql security definer set search_path = '' as $$
declare plain_code text;
begin
  if auth.uid() is null or not public.owns_elder(target_elder) then raise exception 'Not authorized'; end if;
  if invited_role not in ('family', 'caretaker') or invited_role is null then raise exception 'Invalid invitation role'; end if;
  -- Serialize issuance per owner to make the active-invitation limit concurrency safe.
  perform 1 from public.elder_profiles where id = target_elder for update;
  if (select count(*) from public.care_invites where elder_profile_id = target_elder and used_at is null and expires_at > now()) >= 10 then
    raise exception 'Revoke an active invitation before creating another';
  end if;
  plain_code := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.care_invites (elder_profile_id, code_hash, role)
    values (target_elder, encode(extensions.digest(plain_code, 'sha256'), 'hex'), invited_role);
  return plain_code;
end;
$$;

create function public.redeem_care_invite(invitation_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare invitation public.care_invites; account_role text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if invitation_code is null or invitation_code !~ '^[a-f0-9]{64}$' then raise exception 'Invitation unavailable'; end if;
  select role into account_role from public.profiles where id = auth.uid();
  if account_role is null or account_role not in ('family', 'caretaker') then raise exception 'This account cannot join a care team'; end if;
  -- Row lock makes consumption atomic even if two people submit the same code.
  select * into invitation from public.care_invites
    where code_hash = encode(extensions.digest(invitation_code, 'sha256'), 'hex') for update;
  if not found or invitation.used_at is not null or invitation.expires_at <= now() or invitation.role <> account_role then
    raise exception 'Invitation unavailable';
  end if;
  insert into public.care_memberships (elder_profile_id, member_id, role)
    values (invitation.elder_profile_id, auth.uid(), invitation.role)
    on conflict (elder_profile_id, member_id) do nothing;
  update public.care_invites set used_at = now(), used_by = auth.uid() where id = invitation.id;
  return invitation.elder_profile_id;
end;
$$;

-- Only the owner can list team names. No emails or other private account fields.
create function public.care_team(target_elder uuid)
returns table (id uuid, display_name text, role text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select m.id, p.display_name, m.role, m.created_at
    from public.care_memberships m join public.profiles p on p.id = m.member_id
    where m.elder_profile_id = target_elder and public.owns_elder(target_elder)
    order by m.created_at;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.owns_elder(uuid), public.can_access_elder(uuid), public.create_care_invite(uuid,text), public.redeem_care_invite(text), public.care_team(uuid) from public, anon;
grant execute on function public.owns_elder(uuid), public.can_access_elder(uuid), public.create_care_invite(uuid,text), public.redeem_care_invite(text), public.care_team(uuid) to authenticated;
commit;
