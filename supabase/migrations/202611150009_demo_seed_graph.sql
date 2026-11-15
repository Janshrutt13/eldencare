begin;
create table public.demo_seed_runs (seed_key text primary key,completed_at timestamptz not null default now());
alter table public.demo_seed_runs enable row level security;
revoke all on public.demo_seed_runs from public,anon,authenticated;
grant select on public.demo_seed_runs to service_role;
create function public.seed_jaipur_graph(group_data jsonb) returns boolean
language plpgsql security definer set search_path='' as $$
declare owner_user uuid;elder uuid;entry jsonb;member_key text;member_user uuid;new_group uuid;message jsonb;message_index integer;sender uuid;sender_name text;
begin
 perform pg_advisory_xact_lock(819214);
 if exists(select 1 from public.demo_seed_runs where seed_key='jaipur-v1') then return false; end if;
 select user_id into owner_user from public.demo_people where demo_key='meera' and role='elderly';
 select id into elder from public.elder_profiles where owner_id=owner_user;
 if elder is null then raise exception 'Seed Meera first'; end if;
 if exists(select 1 from public.social_groups where demo_key like 'jaipur-v1:%') then raise exception 'Demo group key collision'; end if;
 -- Link only seeded family/caretakers to the seeded Meera, never to a real elder.
 insert into public.care_memberships(elder_profile_id,member_id,role)
 select elder,user_id,role from public.demo_people where demo_key in ('ananya','amit','rahul','priya') and role in ('family','caretaker')
 on conflict(elder_profile_id,member_id) do nothing;
 for entry in select * from jsonb_array_elements(group_data) loop
   insert into public.social_groups(name,created_by,description,interests,demo_key)
   values(entry->>'name',owner_user,entry->>'description',array(select jsonb_array_elements_text(entry->'interests')),'jaipur-v1:'||(entry->>'key')) returning id into new_group;
   for member_key in select jsonb_array_elements_text(entry->'members') loop
     select user_id into member_user from public.demo_people where demo_key=member_key and role='elderly';
     if member_user is null then raise exception 'Missing demo group member'; end if;
     insert into public.social_group_members(group_id,user_id,display_name) select new_group,user_id,display_name from public.demo_people where user_id=member_user;
     if member_user<>owner_user then
       insert into public.connection_requests(requester_id,recipient_id,requester_name,recipient_name,status)
       select owner_user,member_user,'Meera',display_name,'accepted' from public.demo_people where user_id=member_user
       on conflict do nothing;
     end if;
   end loop;
   message_index:=0;
   for message in select * from jsonb_array_elements(entry->'messages') loop
     select user_id,display_name into sender,sender_name from public.demo_people where demo_key=message->>'sender';
     if not exists(select 1 from public.social_group_members where group_id=new_group and user_id=sender) then raise exception 'Sender is not a member'; end if;
     insert into public.social_messages(group_id,sender_id,sender_name,body,created_at,demo_key)
     values(new_group,sender,sender_name,message->>'body',now()-interval '1 hour'+make_interval(secs=>message_index*60),'jaipur-v1:'||(entry->>'key')||':'||message_index::text);
     message_index:=message_index+1;
   end loop;
 end loop;
 insert into public.demo_seed_runs(seed_key) values('jaipur-v1');
 return true;
end $$;
revoke all on function public.seed_jaipur_graph(jsonb) from public,anon,authenticated;
grant execute on function public.seed_jaipur_graph(jsonb) to service_role;
commit;
