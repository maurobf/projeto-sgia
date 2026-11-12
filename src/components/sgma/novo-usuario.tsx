import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { criarUsuario } from "@/lib/auth.functions";
import { ROTULO_PERFIL, type Perfil } from "@/lib/sgma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function NovoUsuarioForm({ perfis, padrao }: { perfis: Perfil[]; padrao: Perfil }) {
  const criar = useServerFn(criarUsuario);
  const qc = useQueryClient();
  const [f, setF] = useState({ nome: "", email: "", matricula: "", senha: "", perfil: padrao });
  const [salvando, setSalvando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const r = await criar({ data: f });
      if ("erro" in r && r.erro) toast.error(r.erro);
      else {
        toast.success(`${ROTULO_PERFIL[f.perfil]} cadastrado com sucesso.`);
        setF({ nome: "", email: "", matricula: "", senha: "", perfil: padrao });
        qc.invalidateQueries();
      }
    } catch {
      toast.error("Verifique os dados: nome, e-mail válido e senha com ao menos 6 caracteres.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
      <div className="space-y-2"><Label htmlFor="nu-nome">Nome completo</Label><Input id="nu-nome" required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="nu-email">E-mail</Label><Input id="nu-email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="nu-mat">Matrícula</Label><Input id="nu-mat" value={f.matricula} onChange={(e) => setF({ ...f, matricula: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="nu-senha">Senha inicial</Label><Input id="nu-senha" type="password" minLength={6} required value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} /></div>
      {perfis.length > 1 ? (
        <div className="space-y-2">
          <Label htmlFor="nu-perfil">Perfil</Label>
          <Select value={f.perfil} onValueChange={(v) => setF({ ...f, perfil: v as Perfil })}>
            <SelectTrigger id="nu-perfil"><SelectValue /></SelectTrigger>
            <SelectContent>{perfis.map((p) => <SelectItem key={p} value={p}>{ROTULO_PERFIL[p]}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      ) : null}
      <Button type="submit" disabled={salvando} className="sm:col-span-2 lg:col-span-1">Cadastrar</Button>
    </form>
  );
}
