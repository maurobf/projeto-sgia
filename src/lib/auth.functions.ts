import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const ERRO = "E-mail ou senha inválidos";

/** Login por matrícula: resolve o e-mail no servidor e só devolve a sessão se a senha conferir. */
export const entrarComMatricula = createServerFn({ method: "POST" })
  .inputValidator((d: { matricula: string; senha: string }) =>
    z.object({ matricula: z.string().trim().min(1).max(30), senha: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: perfil } = await supabaseAdmin
      .from("profiles")
      .select("email, ativo")
      .eq("matricula", data.matricula)
      .maybeSingle();
    if (!perfil?.email || !perfil.ativo) return { erro: ERRO } as const;
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const cliente = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: s, error } = await cliente.auth.signInWithPassword({ email: perfil.email, password: data.senha });
    if (error || !s.session) return { erro: ERRO } as const;
    return { access_token: s.session.access_token, refresh_token: s.session.refresh_token } as const;
  });

const novoUsuarioSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  matricula: z.string().trim().max(30).optional().default(""),
  senha: z.string().min(6).max(100),
  perfil: z.enum(["admin", "coordenador", "monitor", "aluno"]),
});

/** Admin cria qualquer perfil; coordenador cria monitores e alunos. */
export const criarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof novoUsuarioSchema>) => novoUsuarioSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: ehAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const { data: ehCoord } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "coordenador" });
    const permitido = ehAdmin || (ehCoord && (data.perfil === "monitor" || data.perfil === "aluno"));
    if (!permitido) return { erro: "Você não tem permissão para criar este perfil." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
      user_metadata: { nome: data.nome, matricula: data.matricula },
    });
    if (error || !criado.user) return { erro: "Não foi possível criar o usuário (e-mail ou matrícula já cadastrados?)." };
    await supabaseAdmin.from("user_roles").insert({ user_id: criado.user.id, role: data.perfil });
    return { ok: true };
  });

/** Admin altera o perfil ou ativa/desativa um usuário. */
export const atualizarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; perfil?: "admin" | "coordenador" | "monitor" | "aluno"; ativo?: boolean }) =>
    z
      .object({
        id: z.string().uuid(),
        perfil: z.enum(["admin", "coordenador", "monitor", "aluno"]).optional(),
        ativo: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: ehAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!ehAdmin) return { erro: "Apenas o administrador pode alterar usuários." };
    if (data.id === context.userId) return { erro: "Você não pode alterar a sua própria conta." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.perfil) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
      await supabaseAdmin.from("user_roles").insert({ user_id: data.id, role: data.perfil });
    }
    if (data.ativo !== undefined) {
      await supabaseAdmin.from("profiles").update({ ativo: data.ativo }).eq("id", data.id);
      await supabaseAdmin.auth.admin.updateUserById(data.id, { ban_duration: data.ativo ? "none" : "876000h" });
    }
    return { ok: true };
  });

export const listarUsuarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: perfis }, { data: papeis }] = await Promise.all([
      context.supabase.from("profiles").select("id, nome, email, matricula, ativo").order("nome"),
      context.supabase.from("user_roles").select("user_id, role"),
    ]);
    return (perfis ?? []).map((p) => ({ ...p, perfil: papeis?.find((r) => r.user_id === p.id)?.role ?? null }));
  });
