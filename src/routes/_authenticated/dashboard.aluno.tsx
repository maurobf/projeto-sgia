import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, MapPin, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { exigirPainel } from "@/lib/sessao";
import { DIAS, monitoriasQuery } from "@/lib/consultas";
import { formatarData, hora } from "@/lib/sgma";
import { LayoutPainel, Metrica } from "@/components/sgma/painel";
import { OuvirBotao } from "@/components/sgma/acessibilidade";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/dashboard/aluno")({
  head: () => ({ meta: [{ title: "Painel do Aluno – SGMA" }, { name: "description", content: "Horários de monitoria e suas presenças." }] }),
  beforeLoad: () => exigirPainel("aluno"),
  component: PainelAluno,
});

function PainelAluno() {
  const { perfil } = Route.useRouteContext();
  const { data: monitorias = [] } = useQuery(monitoriasQuery);
  const { data: presencas = [] } = useQuery({
    queryKey: ["minhas-presencas"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      return (
        (
          await supabase
            .from("presencas")
            .select("id, presente, atendimentos(data, topicos, monitorias(disciplinas(codigo, nome)))")
            .eq("aluno_id", u.user!.id)
        ).data ?? []
      ).sort((a, b) => (b.atendimentos?.data ?? "").localeCompare(a.atendimentos?.data ?? ""));
    },
  });
  const ordenadas = [...monitorias].sort((a, b) => DIAS.indexOf(a.dia_semana) - DIAS.indexOf(b.dia_semana));
  const presentes = presencas.filter((p) => p.presente).length;

  return (
    <LayoutPainel perfil={perfil} titulo="Painel do Aluno" descricao="Consulte os horários das monitorias e acompanhe suas presenças.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metrica rotulo="Monitorias disponíveis" valor={monitorias.length} />
        <Metrica rotulo="Presenças registradas" valor={presentes} />
        <Metrica rotulo="Frequência" valor={presencas.length ? `${Math.round((presentes / presencas.length) * 100)}%` : "—"} />
      </div>

      <section aria-labelledby="horarios">
        <h2 id="horarios" className="mb-3 text-xl font-semibold">Horários de monitoria</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {ordenadas.map((m) => {
            const texto = `${m.disciplinas?.nome}. ${m.dia_semana}, das ${hora(m.horario_inicio)} às ${hora(m.horario_fim)}. Local: ${m.local}. Monitor: ${m.profiles?.nome}.`;
            return (
              <li key={m.id} className="rounded-lg border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="secondary">{m.disciplinas?.codigo}</Badge>
                    <h3 className="mt-2 font-semibold">{m.disciplinas?.nome}</h3>
                  </div>
                  <OuvirBotao texto={texto} />
                </div>
                <dl className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><CalendarClock className="size-4 text-primary" aria-hidden="true" /><dt className="sr-only">Horário</dt><dd>{m.dia_semana}, {hora(m.horario_inicio)} – {hora(m.horario_fim)}</dd></div>
                  <div className="flex items-center gap-2"><MapPin className="size-4 text-primary" aria-hidden="true" /><dt className="sr-only">Local</dt><dd>{m.local}</dd></div>
                  <div className="flex items-center gap-2"><User className="size-4 text-primary" aria-hidden="true" /><dt className="sr-only">Monitor</dt><dd>{m.profiles?.nome}</dd></div>
                </dl>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="presencas" className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 id="presencas" className="mb-3 text-xl font-semibold">Minhas Presenças</h2>
        <Table>
          <TableCaption>Histórico de frequência nas monitorias</TableCaption>
          <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Disciplina</TableHead><TableHead>Tópicos</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader>
          <TableBody>
            {presencas.length === 0 && <TableRow><TableCell colSpan={4} className="text-muted-foreground">Nenhuma presença registrada ainda.</TableCell></TableRow>}
            {presencas.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.atendimentos ? formatarData(p.atendimentos.data) : ""}</TableCell>
                <TableCell>{p.atendimentos?.monitorias?.disciplinas?.nome}</TableCell>
                <TableCell>{p.atendimentos?.topicos}</TableCell>
                <TableCell><Badge variant={p.presente ? "default" : "destructive"}>{p.presente ? "Presente" : "Ausente"}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </LayoutPainel>
  );
}
