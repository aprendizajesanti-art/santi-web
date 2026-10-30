-- Ejecutar en el SQL Editor de Supabase antes de desplegar.
-- Autorizar solo las cuentas del equipo que ya existen al aplicar la migración.
-- Las altas posteriores no reciben acceso automáticamente.
create table if not exists public.contact_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.contact_admins enable row level security;
revoke all on public.contact_admins from anon, authenticated;
grant select on public.contact_admins to authenticated;
drop policy if exists contact_admin_self on public.contact_admins;
create policy contact_admin_self on public.contact_admins for select to authenticated
  using (user_id = (select auth.uid()));
insert into public.contact_admins (user_id)
  select id from auth.users where email is not null and is_anonymous = false
  on conflict do nothing;
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(trim(nombre)) between 2 and 120),
  telefono text not null check (
    char_length(telefono) <= 30 and telefono ~ '^[+0-9 ().-]+$'
    and char_length(regexp_replace(telefono, '[^0-9]', '', 'g')) between 7 and 15
  ),
  servicio text not null check (char_length(trim(servicio)) between 1 and 160),
  mensaje text not null default '' check (char_length(mensaje) <= 2000),
  consentimiento boolean not null check (consentimiento = true),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_contacto', 'atendido')),
  created_at timestamptz not null default now()
);
create index if not exists contact_requests_created_idx on public.contact_requests (created_at desc);
alter table public.contact_requests enable row level security;
revoke all on public.contact_requests from anon, authenticated;
grant insert (id, nombre, telefono, servicio, mensaje, consentimiento) on public.contact_requests to anon, authenticated;
grant select on public.contact_requests to authenticated;
grant update (estado) on public.contact_requests to authenticated;
drop policy if exists contacts_insert on public.contact_requests;
create policy contacts_insert on public.contact_requests for insert to anon, authenticated
  with check (consentimiento = true and estado = 'pendiente');
drop policy if exists contacts_admin_read on public.contact_requests;
create policy contacts_admin_read on public.contact_requests for select to authenticated
  using (exists (select 1 from public.contact_admins where user_id = (select auth.uid())));
drop policy if exists contacts_admin_update on public.contact_requests;
create policy contacts_admin_update on public.contact_requests for update to authenticated
  using (exists (select 1 from public.contact_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.contact_admins where user_id = (select auth.uid())));
