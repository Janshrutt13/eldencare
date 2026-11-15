begin;
create table public.usage_counters (
 user_id uuid not null references public.profiles(id) on delete cascade,
 purpose text not null, window_start timestamptz not null, count integer not null,
 primary key(user_id,purpose,window_start)
);
alter table public.usage_counters enable row level security;
revoke all on public.usage_counters from anon,authenticated;
create function public.consume_usage(usage_purpose text) returns boolean
language plpgsql security definer set search_path='' as $$
declare used integer; quota integer; bucket timestamptz;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if usage_purpose='ai' then quota:=20;bucket:=date_trunc('hour',now());
 elsif usage_purpose='message' then quota:=30;bucket:=date_trunc('minute',now());
 elsif usage_purpose='call' then quota:=20;bucket:=date_trunc('day',now());
 elsif usage_purpose='connection' then quota:=30;bucket:=date_trunc('day',now());
 else raise exception 'Invalid usage category'; end if;
 insert into public.usage_counters(user_id,purpose,window_start,count) values(auth.uid(),usage_purpose,bucket,1)
 on conflict(user_id,purpose,window_start) do update set count=public.usage_counters.count+1 returning count into used;
 return used<=quota;
end $$;
-- A table trigger also covers direct RPC callers, not just Next.js actions.
create function public.check_social_usage() returns trigger
language plpgsql security definer set search_path='' as $$
declare category text;
begin
 if auth.uid() is null then return new; end if;
 category:=case tg_table_name when 'social_messages' then 'message' when 'connection_requests' then 'connection' else 'call' end;
 if not public.consume_usage(category) then raise exception 'Usage limit reached. Please try later.'; end if;
 return new;
end $$;
create trigger message_usage before insert on public.social_messages for each row execute function public.check_social_usage();
create trigger connection_usage before insert on public.connection_requests for each row execute function public.check_social_usage();
create trigger call_usage before insert on public.companion_call_requests for each row execute function public.check_social_usage();
revoke all on function public.check_social_usage() from public,anon,authenticated;
revoke all on function public.consume_usage(text) from public,anon;
grant execute on function public.consume_usage(text) to authenticated;
commit;
