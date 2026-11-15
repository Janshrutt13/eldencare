begin;
create table public.medications (
 id uuid primary key default gen_random_uuid(),
 elder_profile_id uuid not null references public.elder_profiles(id) on delete cascade,
 name text not null check (length(name) between 1 and 120),
 dosage text not null check (length(dosage) between 1 and 300),
 times time[] not null check (cardinality(times) between 1 and 12),
 start_date date not null, end_date date,
 notes text not null default '' check (length(notes)<=2000),
 active boolean not null default true,
 schedule_updated_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 check (end_date is null or end_date >= start_date)
);
create index medications_elder_idx on public.medications(elder_profile_id);
create table public.medication_doses (
 id uuid primary key default gen_random_uuid(),
 medication_id uuid not null references public.medications(id),
 elder_profile_id uuid not null references public.elder_profiles(id) on delete cascade,
 medication_name text not null, dosage text not null,
 scheduled_at timestamptz not null,
 status text not null default 'pending' check (status in ('pending','taken','skipped')),
 confirmed_at timestamptz, confirmed_by uuid references public.profiles(id) on delete set null,
 unique(medication_id,scheduled_at),
 check ((status='pending' and confirmed_at is null) or (status<>'pending' and confirmed_at is not null))
);
create index doses_elder_time_idx on public.medication_doses(elder_profile_id,scheduled_at);
create table public.appointments (
 id uuid primary key default gen_random_uuid(),
 elder_profile_id uuid not null references public.elder_profiles(id) on delete cascade,
 doctor_name text not null check(length(doctor_name) between 1 and 120),
 specialization text not null default '' check(length(specialization)<=120),
 scheduled_at timestamptz not null,
 location text not null check(length(location) between 1 and 500),
 notes text not null default '' check(length(notes)<=2000),
 created_at timestamptz not null default now()
);
create index appointments_elder_time_idx on public.appointments(elder_profile_id,scheduled_at);

alter table public.medications enable row level security;
alter table public.medication_doses enable row level security;
alter table public.appointments enable row level security;
revoke all on public.medications, public.medication_doses, public.appointments from anon, authenticated;
grant select on public.medications, public.medication_doses, public.appointments to authenticated;
grant insert,update,delete on public.appointments to authenticated;
create policy medications_read on public.medications for select to authenticated using(public.can_access_elder(elder_profile_id));
create policy doses_read on public.medication_doses for select to authenticated using(public.can_access_elder(elder_profile_id));
create policy appointments_access on public.appointments for all to authenticated using(public.can_access_elder(elder_profile_id)) with check(public.can_access_elder(elder_profile_id));

-- Internal generator. UTC instants are derived from the elder owner's timezone.
-- Never invent historical occurrences for time before the schedule was created.
create function public.generate_doses_internal(target_elder uuid) returns void
language sql security definer set search_path='' as $$
 insert into public.medication_doses(medication_id,elder_profile_id,medication_name,dosage,scheduled_at)
 select m.id,m.elder_profile_id,m.name,m.dosage,(d.day::date+t.clock) at time zone p.timezone
 from public.medications m
 join public.elder_profiles e on e.id=m.elder_profile_id
 join public.profiles p on p.id=e.owner_id
 cross join lateral generate_series(
   greatest(m.start_date,(now() at time zone p.timezone)::date-7)::timestamp,
   least(coalesce(m.end_date,(now() at time zone p.timezone)::date+2),(now() at time zone p.timezone)::date+2)::timestamp,
   interval '1 day') d(day)
 cross join lateral unnest(m.times) t(clock)
 where m.elder_profile_id=target_elder and m.active
 and (d.day::date+t.clock) at time zone p.timezone >= greatest(m.created_at,m.schedule_updated_at)
 on conflict(medication_id,scheduled_at) do nothing;
$$;
create function public.ensure_doses(target_elder uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not public.can_access_elder(target_elder) then raise exception 'Not authorized'; end if;
 perform 1 from public.elder_profiles where id=target_elder for update;
 perform public.generate_doses_internal(target_elder);
end $$;

create function public.save_medication(payload jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare elder uuid := (payload->>'elder_profile_id')::uuid; med uuid := nullif(payload->>'id','')::uuid; clocks time[];
begin
 if not public.can_access_elder(elder) then raise exception 'Not authorized'; end if;
 perform 1 from public.elder_profiles where id=elder for update;
 select array_agg(distinct value::time order by value::time) into clocks from jsonb_array_elements_text(payload->'times');
 if med is null then
   insert into public.medications(elder_profile_id,name,dosage,times,start_date,end_date,notes)
   values(elder,payload->>'name',payload->>'dosage',clocks,(payload->>'start_date')::date,nullif(payload->>'end_date','')::date,coalesce(payload->>'notes','')) returning id into med;
 else
   update public.medications set name=payload->>'name',dosage=payload->>'dosage',times=clocks,
     start_date=(payload->>'start_date')::date,end_date=nullif(payload->>'end_date','')::date,notes=coalesce(payload->>'notes',''),schedule_updated_at=now()
     where id=med and elder_profile_id=elder and active;
   if not found then raise exception 'Medication unavailable'; end if;
   -- Preserve all historical and confirmed occurrences. Replace only pending future ones.
   delete from public.medication_doses where medication_id=med and status='pending' and scheduled_at>now();
 end if;
 perform public.generate_doses_internal(elder);
 return med;
end $$;
create function public.remove_medication(target_medication uuid) returns void
language plpgsql security definer set search_path='' as $$
declare elder uuid;
begin
 select elder_profile_id into elder from public.medications where id=target_medication;
 if elder is null or not public.can_access_elder(elder) then raise exception 'Not authorized'; end if;
 perform 1 from public.elder_profiles where id=elder for update;
 update public.medications set active=false where id=target_medication;
 delete from public.medication_doses where medication_id=target_medication and status='pending' and scheduled_at>now();
end $$;
create function public.confirm_dose(target_dose uuid, new_status text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if new_status not in ('taken','skipped') or new_status is null then raise exception 'Invalid status'; end if;
 update public.medication_doses set status=new_status,confirmed_at=now(),confirmed_by=auth.uid()
 where id=target_dose and public.can_access_elder(elder_profile_id) and scheduled_at<=now();
 if not found then raise exception 'Dose unavailable or not due yet'; end if;
end $$;
revoke all on function public.generate_doses_internal(uuid) from public,anon,authenticated;
revoke all on function public.ensure_doses(uuid),public.save_medication(jsonb),public.remove_medication(uuid),public.confirm_dose(uuid,text) from public,anon;
grant execute on function public.ensure_doses(uuid),public.save_medication(jsonb),public.remove_medication(uuid),public.confirm_dose(uuid,text) to authenticated;
commit;
