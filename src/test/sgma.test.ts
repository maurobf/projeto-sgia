import { describe, expect, it } from "vitest";
import { ERRO_LOGIN, painelDoPerfil, podeAcessar } from "@/lib/sgma";

describe("regras de acesso do SGMA", () => {
  it("redireciona cada perfil ao seu painel", () => {
    expect(painelDoPerfil("coordenador")).toBe("/dashboard/coordenador");
    expect(painelDoPerfil("monitor")).toBe("/dashboard/monitor");
    expect(painelDoPerfil("aluno")).toBe("/dashboard/aluno");
    expect(painelDoPerfil("admin")).toBe("/dashboard/admin");
    expect(painelDoPerfil(null)).toBe("/login");
  });
  it("mensagem de erro de login é exata", () => {
    expect(ERRO_LOGIN).toBe("E-mail ou senha inválidos");
  });
  it("aluno não acessa painel do coordenador; admin acessa todos", () => {
    expect(podeAcessar("aluno", "coordenador")).toBe(false);
    expect(podeAcessar("monitor", "monitor")).toBe(true);
    expect(podeAcessar("admin", "aluno")).toBe(true);
  });
});
