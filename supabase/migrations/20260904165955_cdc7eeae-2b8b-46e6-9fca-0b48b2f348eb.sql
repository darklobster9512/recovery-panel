create type public.todo_priority as enum ('normal', 'dringend');
create type public.todo_status as enum ('offen', 'abgeschlossen');

create table public.todos (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    assigned_caller_id uuid references auth.users(id) on delete set null,
    priority public.todo_priority not null default 'normal',
    status public.todo_status not null default 'offen',
    due_date date,
    created_by uuid references auth.users(id) on delete set null,
    completed_at timestamp with time zone,
    completed_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

grant select, insert, update, delete on public.todos to authenticated;
grant all on public.todos to service_role;

alter table public.todos enable row level security;

create policy "Admins manage all todos" on public.todos
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Callers see own todos" on public.todos
for select to authenticated
using (assigned_caller_id = auth.uid() and public.has_role(auth.uid(), 'caller'));

create policy "Callers update own todos status" on public.todos
for update to authenticated
using (assigned_caller_id = auth.uid() and public.has_role(auth.uid(), 'caller'))
with check (assigned_caller_id = auth.uid() and public.has_role(auth.uid(), 'caller'));

create table public.todo_activity (
    id uuid primary key default gen_random_uuid(),
    todo_id uuid not null references public.todos(id) on delete cascade,
    actor_id uuid references auth.users(id) on delete set null,
    action text not null,
    details jsonb not null default '{}',
    created_at timestamp with time zone not null default now()
);

grant select, insert on public.todo_activity to authenticated;
grant all on public.todo_activity to service_role;

alter table public.todo_activity enable row level security;

create policy "Admins read todo activity" on public.todo_activity
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "System inserts todo activity" on public.todo_activity
for insert to authenticated
with check (true);

create or replace function public.todos_restrict_caller_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    NEW.title := OLD.title;
    NEW.description := OLD.description;
    NEW.assigned_caller_id := OLD.assigned_caller_id;
    NEW.priority := OLD.priority;
    NEW.due_date := OLD.due_date;
    NEW.created_by := OLD.created_by;
  end if;
  return NEW;
end;
$$;

create trigger trg_todos_restrict_caller_updates
before update on public.todos
for each row execute function public.todos_restrict_caller_updates();

create or replace function public.todos_log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.assigned_caller_id is not null then
      insert into public.todo_activity (todo_id, actor_id, action, details)
      values (NEW.id, auth.uid(), 'assigned', jsonb_build_object('assigned_caller_id', NEW.assigned_caller_id));
    end if;
  elsif TG_OP = 'UPDATE' then
    if NEW.assigned_caller_id is distinct from OLD.assigned_caller_id and NEW.assigned_caller_id is not null then
      insert into public.todo_activity (todo_id, actor_id, action, details)
      values (NEW.id, auth.uid(), 'assigned', jsonb_build_object('assigned_caller_id', NEW.assigned_caller_id));
    end if;
    if NEW.status = 'abgeschlossen' and OLD.status <> 'abgeschlossen' then
      insert into public.todo_activity (todo_id, actor_id, action, details)
      values (NEW.id, auth.uid(), 'completed', jsonb_build_object('completed_by', NEW.completed_by));
    end if;
  end if;
  return NEW;
end;
$$;

create trigger trg_todos_log_activity
after insert or update on public.todos
for each row execute function public.todos_log_activity();

create trigger trg_todos_updated
before update on public.todos
for each row execute function public.leads_touch_updated_at();

alter type public.telegram_event add value if not exists 'todo_completed';
