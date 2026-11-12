export type Perfil = "admin" | "coordenador" | "monitor" | "aluno";

export const ERRO_LOGIN = "E-mail ou senha inválidos";

export const ROTULO_PERFIL: Record<Perfil, string> = {
  admin: "Administrador",
  coordenador: "Coordenador Acadêmico",
  monitor: "Monitor",
  aluno: "Aluno",
};

export function painelDoPerfil(perfil: Perfil | null | undefined) {
  switch (perfil) {
    case "admin":
      return "/dashboard/admin" as const;
    case "coordenador":
      return "/dashboard/coordenador" as const;
    case "monitor":
      return "/dashboard/monitor" as const;
    case "aluno":
      return "/dashboard/aluno" as const;
    default:
      return "/login" as const;
  }
}

/** Admin acessa todos os painéis; os demais só o próprio. */
export function podeAcessar(perfil: Perfil | null | undefined, painel: Perfil) {
  if (!perfil) return false;
  return perfil === "admin" || perfil === painel;
}

export function ehEmail(identificador: string) {
  return identificador.includes("@");
}

export function formatarData(iso: string) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

export function hora(t: string) {
  return t.slice(0, 5);
}

export function gerarCsv(linhas: (string | number)[][]) {
  return linhas
    .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
}
