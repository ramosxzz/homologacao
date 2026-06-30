-- Solaire Solar - Supabase bootstrap
-- Rode este arquivo no SQL Editor do Supabase antes de usar o app.

create extension if not exists pgcrypto;

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome_fantasia text not null,
  razao_social text not null,
  cnpj text not null default '',
  email text not null default '',
  telefone text not null default '',
  endereco jsonb not null default jsonb_build_object(
    'cep', '',
    'logradouro', '',
    'numero', '',
    'bairro', '',
    'cidade', '',
    'uf', 'RS'
  ),
  logo text not null default '',
  responsavel_tecnico jsonb not null default jsonb_build_object(
    'nome', '',
    'crea', '',
    'cpf', ''
  ),
  criado_em timestamptz not null default now()
);

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  email text not null,
  role text not null default 'admin' check (role in ('admin', 'engenheiro')),
  criado_em timestamptz not null default now()
);

create table if not exists public.projetos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  status text not null default 'rascunho' check (status in ('rascunho', 'em_andamento', 'concluido', 'enviado')),
  distribuidora text not null check (distribuidora in ('CEEE', 'RGE')),
  cliente jsonb not null,
  unidade_consumidora jsonb not null,
  endereco jsonb not null,
  localizacao jsonb not null,
  sistema_fv jsonb not null,
  compensacao jsonb not null default jsonb_build_object('modalidade', 'geracao_local', 'beneficiarios', jsonb_build_array()),
  documentos_gerados jsonb not null default jsonb_build_array(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists usuarios_empresa_id_idx on public.usuarios(empresa_id);
create index if not exists projetos_empresa_atualizado_idx on public.projetos(empresa_id, atualizado_em desc);

alter table public.empresas enable row level security;
alter table public.usuarios enable row level security;
alter table public.projetos enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.empresas to authenticated;
grant select, insert, update, delete on public.usuarios to authenticated;
grant select, insert, update, delete on public.projetos to authenticated;

drop policy if exists "usuarios_select_mesma_empresa" on public.usuarios;
create policy "usuarios_select_mesma_empresa"
on public.usuarios for select
to authenticated
using (id = (select auth.uid()));

drop policy if exists "empresas_select_da_empresa" on public.empresas;
create policy "empresas_select_da_empresa"
on public.empresas for select
to authenticated
using (
  id in (
    select u.empresa_id from public.usuarios u where u.id = (select auth.uid())
  )
);

drop policy if exists "empresas_update_da_empresa_admin" on public.empresas;
create policy "empresas_update_da_empresa_admin"
on public.empresas for update
to authenticated
using (
  id in (
    select u.empresa_id from public.usuarios u
    where u.id = (select auth.uid()) and u.role = 'admin'
  )
)
with check (
  id in (
    select u.empresa_id from public.usuarios u
    where u.id = (select auth.uid()) and u.role = 'admin'
  )
);

drop policy if exists "projetos_select_da_empresa" on public.projetos;
create policy "projetos_select_da_empresa"
on public.projetos for select
to authenticated
using (
  empresa_id in (
    select u.empresa_id from public.usuarios u where u.id = (select auth.uid())
  )
);

drop policy if exists "projetos_insert_da_empresa" on public.projetos;
create policy "projetos_insert_da_empresa"
on public.projetos for insert
to authenticated
with check (
  usuario_id = (select auth.uid())
  and empresa_id in (
    select u.empresa_id from public.usuarios u where u.id = (select auth.uid())
  )
);

drop policy if exists "projetos_update_da_empresa" on public.projetos;
create policy "projetos_update_da_empresa"
on public.projetos for update
to authenticated
using (
  empresa_id in (
    select u.empresa_id from public.usuarios u where u.id = (select auth.uid())
  )
)
with check (
  empresa_id in (
    select u.empresa_id from public.usuarios u where u.id = (select auth.uid())
  )
);

drop function if exists public.handle_new_user() cascade;
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  empresa_id uuid;
  meta jsonb;
begin
  meta := new.raw_user_meta_data;

  insert into public.empresas (
    nome_fantasia,
    razao_social,
    cnpj,
    email,
    responsavel_tecnico
  )
  values (
    coalesce(meta->>'nomeEmpresa', 'Empresa Solaire'),
    coalesce(meta->>'nomeEmpresa', 'Empresa Solaire'),
    coalesce(meta->>'cnpj', ''),
    new.email,
    jsonb_build_object(
      'nome', coalesce(meta->>'nome', ''),
      'crea', coalesce(meta->>'crea', ''),
      'cpf', ''
    )
  )
  returning id into empresa_id;

  insert into public.usuarios (
    id,
    empresa_id,
    nome,
    email,
    role
  )
  values (
    new.id,
    empresa_id,
    coalesce(meta->>'nome', new.email),
    new.email,
    'admin'
  );

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
