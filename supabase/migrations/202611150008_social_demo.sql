begin;
-- Admin-created public fiction only. Never populate this table from patient input.
create table public.demo_people (
 demo_key text primary key, user_id uuid not null unique references public.profiles(id) on delete cascade,
 display_name text not null, age integer not null check(age between 18 and 110),
 role text not null check(role in ('elderly','family','caretaker','volunteer')),
 category text not null, bio text not null, interests text[] not null,
 latitude double precision not null check(latitude between -90 and 90),
 longitude double precision not null check(longitude between -180 and 180),
 availability text not null, contact_label text not null
);
alter table public.demo_people enable row level security;
revoke all on public.demo_people from public,anon,authenticated;
grant select on public.demo_people to authenticated;
grant select,insert on public.demo_people to service_role;
create policy demo_fiction_read on public.demo_people for select to authenticated using(true);
alter table public.social_groups add column description text not null default '' check(length(description)<=500);
alter table public.social_groups add column interests text[] not null default '{}';
alter table public.social_groups add column demo_key text unique;
alter table public.social_messages add column demo_key text unique;
-- No authenticated insert/update grants on these tables; demo keys cannot be self-assigned.
grant select,insert on public.social_groups,public.social_group_members,public.social_messages,public.connection_requests,public.care_memberships to service_role;

create function public.remove_connection(request_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 delete from public.connection_requests where id=request_id and status='accepted' and auth.uid() in (requester_id,recipient_id);
 if not found then raise exception 'Connection unavailable'; end if;
 -- Existing shared groups are intentionally independent. Users can leave them.
end $$;

create or replace function public.request_connection(target_user uuid) returns void
language plpgsql security definer set search_path='' as $$
declare me public.social_profiles; other public.social_profiles;
begin
 select * into me from public.social_profiles where user_id=auth.uid();
 select * into other from public.social_profiles where user_id=target_user;
 if me.user_id is null or other.user_id is null or not me.discovery_enabled or not other.discovery_enabled or target_user=auth.uid() then raise exception 'Connection unavailable'; end if;
 -- Fictional Jaipur fixtures are explicitly discoverable from the demo map,
 -- independent of the viewer's actual profile coordinates. Real profiles retain distance checks.
 if not exists(select 1 from public.demo_people where user_id=target_user and role='elderly')
 and not exists(select 1 from public.nearby_people(10) where user_id=target_user) then raise exception 'Outside discovery radius'; end if;
 insert into public.connection_requests(requester_id,recipient_id,requester_name,recipient_name) values(auth.uid(),target_user,me.display_name,other.display_name);
end $$;

create function public.demo_discovery()
returns setof public.demo_people language sql stable security definer set search_path='' as $$
 select d.* from public.demo_people d join public.social_profiles s on s.user_id=d.user_id
 where auth.uid() is not null and s.discovery_enabled and d.role='elderly' and d.user_id<>auth.uid();
$$;
create function public.group_summaries()
returns table(id uuid,name text,description text,interests text[],demo_key text,member_count bigint,member_names text[],recent_message text)
language sql stable security definer set search_path='' as $$
 select g.id,g.name,g.description,g.interests,g.demo_key,
 (select count(*) from public.social_group_members m where m.group_id=g.id),
 array(select m.display_name from public.social_group_members m where m.group_id=g.id order by m.joined_at limit 12),
 (select s.sender_name||': '||left(s.body,140) from public.social_messages s where s.group_id=g.id order by s.created_at desc,s.id desc limit 1)
 from public.social_groups g where public.is_group_member(g.id) order by g.created_at limit 50;
$$;
revoke all on function public.remove_connection(uuid),public.demo_discovery(),public.group_summaries() from public,anon;
grant execute on function public.remove_connection(uuid),public.demo_discovery(),public.group_summaries() to authenticated;
commit;
