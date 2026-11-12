create type public.app_role as enum ('admin','coordenador','monitor','aluno');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text,
  matricula text unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.get_my_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.user_roles where user_id = auth.uid()
  order by case role when 'admin' then 1 when 'coordenador' then 2 when 'monitor' then 3 else 4 end
  limit 1
$$;

create or replace function public.is_gestor(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id,'admin') or public.has_role(_user_id,'coordenador')
$$;

create policy "perfis visiveis a autenticados" on public.profiles for select to authenticated using (true);
create policy "atualiza proprio perfil" on public.profiles for update to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "ver proprio papel ou gestor" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_gestor(auth.uid()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, email, matricula)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome',''), new.email, nullif(new.raw_user_meta_data->>'matricula',''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.disciplinas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  curso text not null default 'Desenvolvimento de Sistemas',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.disciplinas to authenticated;
grant all on public.disciplinas to service_role;
alter table public.disciplinas enable row level security;
create policy "disciplinas leitura" on public.disciplinas for select to authenticated using (true);
create policy "disciplinas gestao" on public.disciplinas for all to authenticated using (public.is_gestor(auth.uid())) with check (public.is_gestor(auth.uid()));

create table public.monitorias (
  id uuid primary key default gen_random_uuid(),
  disciplina_id uuid not null references public.disciplinas(id) on delete cascade,
  monitor_id uuid not null references public.profiles(id) on delete cascade,
  dia_semana text not null,
  horario_inicio time not null,
  horario_fim time not null,
  local text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.monitorias to authenticated;
grant all on public.monitorias to service_role;
alter table public.monitorias enable row level security;
create policy "monitorias leitura" on public.monitorias for select to authenticated using (true);
create policy "monitorias gestao" on public.monitorias for all to authenticated using (public.is_gestor(auth.uid())) with check (public.is_gestor(auth.uid()));

create table public.atendimentos (
  id uuid primary key default gen_random_uuid(),
  monitoria_id uuid not null references public.monitorias(id) on delete cascade,
  monitor_id uuid not null references public.profiles(id) on delete cascade,
  data date not null default current_date,
  topicos text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.atendimentos to authenticated;
grant all on public.atendimentos to service_role;
alter table public.atendimentos enable row level security;
create policy "atendimentos leitura" on public.atendimentos for select to authenticated using (true);
create policy "monitor registra atendimento" on public.atendimentos for insert to authenticated
  with check (monitor_id = auth.uid() and exists (select 1 from public.monitorias m where m.id = monitoria_id and m.monitor_id = auth.uid()));
create policy "gestor gerencia atendimentos" on public.atendimentos for delete to authenticated using (public.is_gestor(auth.uid()) or monitor_id = auth.uid());

create table public.presencas (
  id uuid primary key default gen_random_uuid(),
  atendimento_id uuid not null references public.atendimentos(id) on delete cascade,
  aluno_id uuid not null references public.profiles(id) on delete cascade,
  presente boolean not null default true,
  unique (atendimento_id, aluno_id)
);
grant select, insert, update, delete on public.presencas to authenticated;
grant all on public.presencas to service_role;
alter table public.presencas enable row level security;
create policy "presencas leitura" on public.presencas for select to authenticated using (
  aluno_id = auth.uid() or public.is_gestor(auth.uid())
  or exists (select 1 from public.atendimentos a where a.id = atendimento_id and a.monitor_id = auth.uid()));
create policy "monitor registra presenca" on public.presencas for insert to authenticated with check (
  exists (select 1 from public.atendimentos a where a.id = atendimento_id and a.monitor_id = auth.uid()));

-- Seed users
create or replace function public._seed_user(_id uuid, _email text, _pw text, _nome text, _mat text, _role public.app_role)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', _id, 'authenticated', 'authenticated', _email,
    extensions.crypt(_pw, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nome', _nome, 'matricula', coalesce(_mat,'')), now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), _id, _id::text, jsonb_build_object('sub', _id::text, 'email', _email, 'email_verified', true), 'email', now(), now(), now());
  insert into public.user_roles (user_id, role) values (_id, _role);
end $$;

select public._seed_user('00000000-0000-4000-8000-000000000001','admin@sgma.local','Admin@123','Administrador do Sistema',null,'admin');
select public._seed_user('00000000-0000-4000-8000-000000000002','coordenador@sgma.local','Coord@123','Profa. Mariana Ribeiro',null,'coordenador');
select public._seed_user('00000000-0000-4000-8000-000000000003','monitor@sgma.local','Monitor@123','Lucas Fernandes','2023101','monitor');
select public._seed_user('00000000-0000-4000-8000-000000000004','beatriz.almeida@sgma.local','Monitor@123','Beatriz Almeida','2023102','monitor');
select public._seed_user('00000000-0000-4000-8000-000000000010','aluno@sgma.local','Aluno@123','Ana Clara Souza','2024001','aluno');
select public._seed_user('00000000-0000-4000-8000-000000000011','joao.pereira@sgma.local','Aluno@123','João Pedro Pereira','2024002','aluno');
select public._seed_user('00000000-0000-4000-8000-000000000012','gabriel.santos@sgma.local','Aluno@123','Gabriel Santos','2024003','aluno');
select public._seed_user('00000000-0000-4000-8000-000000000013','larissa.oliveira@sgma.local','Aluno@123','Larissa Oliveira','2024004','aluno');
select public._seed_user('00000000-0000-4000-8000-000000000014','rafael.costa@sgma.local','Aluno@123','Rafael Costa','2024005','aluno');
drop function public._seed_user(uuid,text,text,text,text,public.app_role);

insert into public.disciplinas (id, codigo, nome) values
 ('10000000-0000-4000-8000-000000000001','DS101','Algoritmos e Lógica de Programação'),
 ('10000000-0000-4000-8000-000000000002','DS102','Banco de Dados I'),
 ('10000000-0000-4000-8000-000000000003','DS201','Programação Web'),
 ('10000000-0000-4000-8000-000000000004','DS202','Estruturas de Dados');

insert into public.monitorias (id, disciplina_id, monitor_id, dia_semana, horario_inicio, horario_fim, local) values
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','Segunda-feira','14:00','16:00','Laboratório 3 – Bloco B'),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000003','Quarta-feira','18:30','20:00','Laboratório 1 – Bloco A'),
 ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000004','Terça-feira','10:00','12:00','Sala 204 – Bloco C'),
 ('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000004','Quinta-feira','15:00','17:00','Biblioteca – Sala de Estudos 2');

insert into public.atendimentos (id, monitoria_id, monitor_id, data, topicos) values
 ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','2026-10-19','Estruturas condicionais e laços de repetição'),
 ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','2026-10-28','Formulários HTML e validação com JavaScript'),
 ('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','2026-11-09','Vetores e funções'),
 ('30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000004','2026-11-03','Modelagem ER e normalização');

insert into public.presencas (atendimento_id, aluno_id, presente) values
 ('30000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010',true),
 ('30000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011',true),
 ('30000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000012',false),
 ('30000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010',true),
 ('30000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000013',true),
 ('30000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000010',false),
 ('30000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000014',true),
 ('30000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000010',true),
 ('30000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000011',true);