create or replace function public.listar_alunos()
returns table (id uuid, nome text, matricula text)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.matricula from public.profiles p
  join public.user_roles r on r.user_id = p.id and r.role = 'aluno'
  where p.ativo and (public.is_gestor(auth.uid()) or public.has_role(auth.uid(),'monitor'))
  order by p.nome
$$;
revoke execute on function public.listar_alunos() from anon;
grant execute on function public.listar_alunos() to authenticated;