import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { painelDoPerfil, podeAcessar, type Perfil } from "./sgma";

export async function meuPerfil(): Promise<Perfil | null> {
  const { data } = await supabase.rpc("get_my_role");
  return (data as Perfil | null) ?? null;
}

/** Guarda de rota: envia cada perfil ao próprio painel. */
export async function exigirPainel(painel: Perfil) {
  const perfil = await meuPerfil();
  if (!podeAcessar(perfil, painel)) throw redirect({ to: painelDoPerfil(perfil) });
  return { perfil: perfil as Perfil };
}
