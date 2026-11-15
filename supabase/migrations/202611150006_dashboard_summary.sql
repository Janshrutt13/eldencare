begin;
create function public.care_summary(target_elder uuid)
returns table(due bigint,taken bigint,skipped bigint,unconfirmed bigint)
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.can_access_elder(target_elder) then raise exception 'Not authorized'; end if;
 return query select count(*),count(*) filter(where status='taken'),count(*) filter(where status='skipped'),
 count(*) filter(where status='pending' and scheduled_at<=now()-interval '60 minutes')
 from public.medication_doses where elder_profile_id=target_elder and scheduled_at between now()-interval '7 days' and now();
end $$;
revoke all on function public.care_summary(uuid) from public,anon;
grant execute on function public.care_summary(uuid) to authenticated;
commit;
