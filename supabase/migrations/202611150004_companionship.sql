begin;
create table public.social_profiles (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 display_name text not null check(length(display_name) between 2 and 80),
 bio text not null default '' check(length(bio)<=500),
 interests text[] not null default '{}' check(cardinality(interests)<=10),
 latitude numeric(5,2) not null check(latitude between -90 and 90),
 longitude numeric(5,2) not null check(longitude between -180 and 180),
 discovery_enabled boolean not null default false,
 available_for_calls boolean not null default false,
 is_demo boolean not null default false
);
create table public.companion_call_requests (
 id uuid primary key default gen_random_uuid(),
 requester_id uuid not null references public.profiles(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 requester_name text not null, recipient_name text not null,
 preferred_at timestamptz,
 status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled')),
 meeting_url text,
 created_at timestamptz not null default now(),
 check(requester_id<>recipient_id)
);
create index calls_recipient_idx on public.companion_call_requests(recipient_id,created_at);
create index calls_requester_idx on public.companion_call_requests(requester_id,created_at);
create unique index calls_one_pending_pair on public.companion_call_requests(least(requester_id,recipient_id),greatest(requester_id,recipient_id)) where status='pending';
create table public.connection_requests (
 id uuid primary key default gen_random_uuid(),
 requester_id uuid not null references public.profiles(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 requester_name text not null, recipient_name text not null,
 status text not null default 'pending' check(status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(),
 check(requester_id<>recipient_id)
);
create unique index connections_pair on public.connection_requests(least(requester_id,recipient_id),greatest(requester_id,recipient_id));
create index connections_recipient_idx on public.connection_requests(recipient_id);
create index connections_requester_idx on public.connection_requests(requester_id);
create table public.social_groups (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 80),
 created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);
create table public.social_group_members (
 group_id uuid not null references public.social_groups(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 display_name text not null,
 joined_at timestamptz not null default now(),
 primary key(group_id,user_id)
);
create index group_members_user_idx on public.social_group_members(user_id);
create table public.social_messages (
 id uuid primary key default gen_random_uuid(), group_id uuid not null references public.social_groups(id) on delete cascade,
 sender_id uuid references public.profiles(id) on delete set null, sender_name text not null,
 body text not null check(length(body) between 1 and 2000), created_at timestamptz not null default now()
);
create index messages_group_time_idx on public.social_messages(group_id,created_at);

create function public.is_group_member(target_group uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.social_group_members where group_id=target_group and user_id=auth.uid());
$$;
create function public.are_connected(first_user uuid,second_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.connection_requests where status='accepted'
 and ((requester_id=first_user and recipient_id=second_user) or (requester_id=second_user and recipient_id=first_user)));
$$;
alter table public.social_profiles enable row level security;
alter table public.companion_call_requests enable row level security;
alter table public.connection_requests enable row level security;
alter table public.social_groups enable row level security;
alter table public.social_group_members enable row level security;
alter table public.social_messages enable row level security;
revoke all on public.social_profiles,public.companion_call_requests,public.connection_requests,public.social_groups,public.social_group_members,public.social_messages from anon,authenticated;
grant select on public.social_profiles,public.companion_call_requests,public.connection_requests,public.social_groups,public.social_group_members,public.social_messages to authenticated;
create policy social_self on public.social_profiles for select to authenticated using(user_id=auth.uid());
create policy calls_participants on public.companion_call_requests for select to authenticated using(auth.uid() in (requester_id,recipient_id));
create policy connections_participants on public.connection_requests for select to authenticated using(auth.uid() in (requester_id,recipient_id));
create policy groups_members on public.social_groups for select to authenticated using(public.is_group_member(id));
create policy members_read on public.social_group_members for select to authenticated using(public.is_group_member(group_id));
create policy messages_members on public.social_messages for select to authenticated using(public.is_group_member(group_id));

create function public.save_social_profile(payload jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 insert into public.social_profiles(user_id,display_name,bio,interests,latitude,longitude,discovery_enabled,available_for_calls)
 values(auth.uid(),payload->>'display_name',coalesce(payload->>'bio',''),array(select jsonb_array_elements_text(payload->'interests')),
 round((payload->>'latitude')::numeric,2),round((payload->>'longitude')::numeric,2),(payload->>'discovery_enabled')::boolean,(payload->>'available_for_calls')::boolean)
 on conflict(user_id) do update set display_name=excluded.display_name,bio=excluded.bio,interests=excluded.interests,
 latitude=excluded.latitude,longitude=excluded.longitude,discovery_enabled=excluded.discovery_enabled,available_for_calls=excluded.available_for_calls;
end $$;
create function public.nearby_people(radius_km integer)
returns table(user_id uuid,display_name text,bio text,interests text[],distance_km numeric,is_demo boolean)
language plpgsql stable security definer set search_path='' as $$
begin
 if radius_km not in (5,10) or radius_km is null then raise exception 'Choose 5 or 10 km'; end if;
 return query
 select other.user_id,other.display_name,other.bio,other.interests,round(distance.km::numeric,1),other.is_demo
 from public.social_profiles me cross join public.social_profiles other
 cross join lateral (select 6371*2*asin(sqrt(least(1.0,
   power(sin(radians((other.latitude-me.latitude)::double precision)/2),2)
   +cos(radians(me.latitude::double precision))*cos(radians(other.latitude::double precision))*power(sin(radians((other.longitude-me.longitude)::double precision)/2),2)))) as km) distance
 where me.user_id=auth.uid() and me.discovery_enabled and other.discovery_enabled and other.user_id<>me.user_id and distance.km<=radius_km
 order by distance.km limit 50;
end $$;
create function public.request_connection(target_user uuid) returns void
language plpgsql security definer set search_path='' as $$
declare me public.social_profiles; other public.social_profiles;
begin
 select * into me from public.social_profiles where user_id=auth.uid();
 select * into other from public.social_profiles where user_id=target_user;
 if me.user_id is null or other.user_id is null or not me.discovery_enabled or not other.discovery_enabled or target_user=auth.uid() then raise exception 'Connection unavailable'; end if;
 if not exists(select 1 from public.nearby_people(10) where user_id=target_user) then raise exception 'Outside discovery radius'; end if;
 insert into public.connection_requests(requester_id,recipient_id,requester_name,recipient_name) values(auth.uid(),target_user,me.display_name,other.display_name);
end $$;
create function public.respond_connection(request_id uuid,decision text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if decision is null or decision not in ('accepted','declined') then raise exception 'Invalid response'; end if;
 update public.connection_requests set status=decision where id=request_id and recipient_id=auth.uid() and status='pending';
 if not found then raise exception 'Request unavailable'; end if;
end $$;

create function public.create_social_group(group_name text,initial_member uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare group_id uuid;
begin
 if auth.uid() is null or not public.are_connected(auth.uid(),initial_member) then raise exception 'Choose an accepted connection'; end if;
 insert into public.social_groups(name,created_by) values(btrim(group_name),auth.uid()) returning id into group_id;
 insert into public.social_group_members(group_id,user_id,display_name)
 select group_id,p.id,coalesce(s.display_name,p.display_name) from public.profiles p left join public.social_profiles s on s.user_id=p.id where p.id in (auth.uid(),initial_member);
 return group_id;
end $$;
create function public.invite_group_member(target_group uuid,target_user uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not public.is_group_member(target_group) or not public.are_connected(auth.uid(),target_user) then raise exception 'Choose an accepted connection'; end if;
 insert into public.social_group_members(group_id,user_id,display_name)
 select target_group,p.id,coalesce(s.display_name,p.display_name) from public.profiles p left join public.social_profiles s on s.user_id=p.id where p.id=target_user
 on conflict do nothing;
end $$;
create function public.leave_social_group(target_group uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 delete from public.social_group_members where group_id=target_group and user_id=auth.uid();
 if not found then raise exception 'Group unavailable'; end if;
end $$;
create function public.send_social_message(target_group uuid,message_body text) returns void
language plpgsql security definer set search_path='' as $$
declare sender text;
begin
 select display_name into sender from public.social_group_members where group_id=target_group and user_id=auth.uid();
 if sender is null then raise exception 'Group unavailable'; end if;
 insert into public.social_messages(group_id,sender_id,sender_name,body) values(target_group,auth.uid(),sender,btrim(message_body));
end $$;

create function public.companion_contacts()
returns table(user_id uuid,display_name text,role text,is_demo boolean)
language sql stable security definer set search_path='' as $$
 select p.id,p.display_name,p.role,coalesce(s.is_demo,false) from public.profiles p left join public.social_profiles s on s.user_id=p.id
 where auth.uid() is not null and p.id<>auth.uid() and (
 (p.role='volunteer' and s.available_for_calls and s.is_demo)
 or exists(select 1 from public.elder_profiles e where public.can_access_elder(e.id)
   and (e.owner_id=p.id or exists(select 1 from public.care_memberships m where m.elder_profile_id=e.id and m.member_id=p.id)))
 ) order by p.display_name limit 100;
$$;
create function public.request_companion_call(target_user uuid,preferred_time timestamptz default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare recipient text; requester text; request_id uuid;
begin
 select display_name into recipient from public.companion_contacts() where user_id=target_user;
 select display_name into requester from public.profiles where id=auth.uid();
 if recipient is null or requester is null then raise exception 'Contact unavailable'; end if;
 if preferred_time is not null and preferred_time<now() then raise exception 'Choose a future time'; end if;
 insert into public.companion_call_requests(requester_id,recipient_id,requester_name,recipient_name,preferred_at)
 values(auth.uid(),target_user,requester,recipient,preferred_time) returning id into request_id;
 insert into public.notifications(recipient_id,kind,event_key) values(target_user,'call_request','call:'||request_id::text);
 return request_id;
end $$;
create function public.respond_companion_call(request_id uuid,decision text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if decision is null or decision not in ('accepted','declined','cancelled') then raise exception 'Invalid response'; end if;
 update public.companion_call_requests set status=decision,
   meeting_url=case when decision='accepted' then 'https://meet.jit.si/EldenCare-'||encode(extensions.gen_random_bytes(24),'hex') else null end
 where id=request_id and status='pending' and ((decision in ('accepted','declined') and recipient_id=auth.uid()) or (decision='cancelled' and requester_id=auth.uid()));
 if not found then raise exception 'Request unavailable'; end if;
end $$;

revoke all on function public.are_connected(uuid,uuid) from public,anon,authenticated;
revoke all on function public.is_group_member(uuid),public.save_social_profile(jsonb),public.nearby_people(integer),public.request_connection(uuid),public.respond_connection(uuid,text),public.create_social_group(text,uuid),public.invite_group_member(uuid,uuid),public.leave_social_group(uuid),public.send_social_message(uuid,text),public.companion_contacts(),public.request_companion_call(uuid,timestamptz),public.respond_companion_call(uuid,text) from public,anon;
grant execute on function public.is_group_member(uuid),public.save_social_profile(jsonb),public.nearby_people(integer),public.request_connection(uuid),public.respond_connection(uuid,text),public.create_social_group(text,uuid),public.invite_group_member(uuid,uuid),public.leave_social_group(uuid),public.send_social_message(uuid,text),public.companion_contacts(),public.request_companion_call(uuid,timestamptz),public.respond_companion_call(uuid,text) to authenticated;
commit;
