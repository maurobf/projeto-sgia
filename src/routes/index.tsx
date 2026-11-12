import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SGMA – Gestão de Monitoria Acadêmica | IFTM" },
      { name: "description", content: "Acesse o Sistema de Gestão de Monitoria Acadêmica do IFTM Uberaba Parque Tecnológico." },
      { property: "og:title", content: "SGMA – Gestão de Monitoria Acadêmica | IFTM" },
      { property: "og:description", content: "Acesse o Sistema de Gestão de Monitoria Acadêmica do IFTM Uberaba Parque Tecnológico." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
});
