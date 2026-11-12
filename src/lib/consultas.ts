import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const disciplinasQuery = queryOptions({
  queryKey: ["disciplinas"],
  queryFn: async () => (await supabase.from("disciplinas").select("*").order("codigo")).data ?? [],
});

export const monitoriasQuery = queryOptions({
  queryKey: ["monitorias"],
  queryFn: async () =>
    (await supabase.from("monitorias").select("*, disciplinas(codigo, nome), profiles(nome)").order("dia_semana")).data ?? [],
});

export const atendimentosQuery = queryOptions({
  queryKey: ["atendimentos"],
  queryFn: async () =>
    (
      await supabase
        .from("atendimentos")
        .select("*, profiles(nome), monitorias(local, disciplinas(codigo, nome)), presencas(aluno_id, presente)")
        .order("data", { ascending: false })
    ).data ?? [],
});

export const alunosQuery = queryOptions({
  queryKey: ["alunos"],
  queryFn: async () => (await supabase.rpc("listar_alunos")).data ?? [],
});

export const monitoresQuery = queryOptions({
  queryKey: ["monitores"],
  queryFn: async () => {
    const { data: papeis } = await supabase.from("user_roles").select("user_id").eq("role", "monitor");
    const ids = (papeis ?? []).map((p) => p.user_id);
    if (!ids.length) return [];
    return (await supabase.from("profiles").select("id, nome, email, matricula, ativo").in("id", ids).order("nome")).data ?? [];
  },
});

export const DIAS = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
