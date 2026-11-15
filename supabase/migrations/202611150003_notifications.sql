begin;
create table public.notifications (
 id uuid primary key default gen_random_uuid(),
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 elder_profile_id uuid references public.elder_profiles(id) on delete cascade,
 dose_id uuid references public.medication_doses(id) on delete set null,
 appointment_id uuid references public.appointments(id) on delete set null,
 kind text not null check(kind in ('dose_upcoming','dose_unconfirmed','appointment','call_request','demo')),
 event_key text not null,
 status text not null default 'pending' check(status in ('pending','processing','sent','failed','cancelled','uncertain')),
 attempts integer not null default 0,
 first_attempt_at timestamptz, locked_until timestamptz, claim_token uuid,
 provider_id text, last_error text, sent_at timestamptz,
 created_at timestamptz not null default now(),
 unique(recipient_id,event_key)
);
create index notifications_queue_idx on public.notifications(status,created_at);
alter table public.notifications enable row level security;
revoke all on public.notifications from anon,authenticated;
grant select on public.notifications to authenticated;
create policy notifications_own on public.notifications for select to authenticated using(recipient_id=auth.uid());

create function public.queue_reminders(upcoming_minutes integer default 30, overdue_minutes integer default 60, appointment_minutes integer default 1440) returns void
language plpgsql security definer set search_path='' as $$
declare elder uuid;
begin
 if upcoming_minutes not between 1 and 1440 or overdue_minutes not between 1 and 1440 or appointment_minutes not between 1 and 10080 then raise exception 'Invalid windows'; end if;
 for elder in select id from public.elder_profiles loop
   perform 1 from public.elder_profiles where id=elder for update;
   perform public.generate_doses_internal(elder);
 end loop;
 insert into public.notifications(recipient_id,elder_profile_id,dose_id,kind,event_key)
 select recipients.user_id,d.elder_profile_id,d.id,
   case when d.scheduled_at>now() then 'dose_upcoming' else 'dose_unconfirmed' end,
   d.id::text || case when d.scheduled_at>now() then ':upcoming' else ':unconfirmed' end
 from public.medication_doses d join public.elder_profiles e on e.id=d.elder_profile_id
 cross join lateral (select e.owner_id as user_id union select member_id from public.care_memberships where elder_profile_id=e.id) recipients
 where d.status='pending' and ((d.scheduled_at>now() and d.scheduled_at<=now()+make_interval(mins=>upcoming_minutes))
 or (d.scheduled_at<=now()-make_interval(mins=>overdue_minutes) and d.scheduled_at>=now()-interval '1 day'))
 on conflict(recipient_id,event_key) do nothing;
 insert into public.notifications(recipient_id,elder_profile_id,appointment_id,kind,event_key)
 select recipients.user_id,a.elder_profile_id,a.id,'appointment',a.id::text||':'||a.scheduled_at::text
 from public.appointments a join public.elder_profiles e on e.id=a.elder_profile_id
 cross join lateral (select e.owner_id as user_id union select member_id from public.care_memberships where elder_profile_id=e.id) recipients
 where a.scheduled_at>now() and a.scheduled_at<=now()+make_interval(mins=>appointment_minutes)
 on conflict(recipient_id,event_key) do nothing;
end $$;

create function public.claim_notifications(only_recipient uuid default null)
returns setof public.notifications language plpgsql security definer set search_path='' as $$
begin
 -- Do not retry ambiguous delivery after Resend's 24-hour idempotency window.
 update public.notifications set status='uncertain',last_error='Delivery requires manual review; retry window expired.'
 where status in ('pending','processing','failed') and first_attempt_at<now()-interval '23 hours';
 update public.notifications n set status='cancelled' where n.status in ('pending','failed','processing')
 and (n.locked_until is null or n.locked_until<now()) and (
   (n.elder_profile_id is not null and not exists(select 1 from public.elder_profiles e where e.id=n.elder_profile_id and (e.owner_id=n.recipient_id or exists(select 1 from public.care_memberships m where m.elder_profile_id=e.id and m.member_id=n.recipient_id))))
   or (n.kind like 'dose_%' and not exists(select 1 from public.medication_doses d where d.id=n.dose_id and d.status='pending' and (n.kind<>'dose_upcoming' or d.scheduled_at>now())))
   or (n.kind='appointment' and not exists(select 1 from public.appointments a where a.id=n.appointment_id and a.scheduled_at>now() and n.event_key=a.id::text||':'||a.scheduled_at::text))
 );
 return query
 with candidates as (
   select id from public.notifications where status in ('pending','failed','processing') and attempts<3
   and (locked_until is null or locked_until<now()) and (only_recipient is null or recipient_id=only_recipient)
   order by created_at for update skip locked limit 10
 ) update public.notifications n set status='processing',attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now()),locked_until=now()+interval '5 minutes',claim_token=gen_random_uuid()
 from candidates c where n.id=c.id returning n.*;
end $$;
create function public.queue_demo_notification() returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 insert into public.notifications(recipient_id,kind,event_key) values(auth.uid(),'demo','demo:'||current_date::text)
 on conflict(recipient_id,event_key) do nothing;
end $$;
revoke all on function public.queue_reminders(integer,integer,integer),public.claim_notifications(uuid) from public,anon,authenticated;
grant execute on function public.queue_reminders(integer,integer,integer),public.claim_notifications(uuid) to service_role;
revoke all on function public.queue_demo_notification() from public,anon;
grant execute on function public.queue_demo_notification() to authenticated;
commit;
