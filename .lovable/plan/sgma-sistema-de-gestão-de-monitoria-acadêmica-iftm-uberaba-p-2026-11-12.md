# SGMA – Sistema de Gestão de Monitoria Acadêmica (IFTM Uberaba Parque Tecnológico)

Toda a interface em Português (Brasil), WCAG 2.1 AA, verde IFTM (#006633), cinza #F4F6F8, azul escuro #1E293B, fonte Inter.

## Telas
1. **/login** – campo "E-mail ou Matrícula", senha mascarada com botão de olho (mostrar/ocultar), botão "Entrar". Erro em vermelho exatamente: "E-mail ou senha inválidos". Após login, lê o perfil e redireciona ao painel correto.
2. **/dashboard/coordenador** – métricas (monitorias, monitores, atendimentos, frequência média) e abas: Cadastrar Disciplina, Cadastrar/Gerenciar Monitores (lista, vincular disciplina e horários), Acompanhar Atividades, Exportar Relatórios de Frequência (CSV).
3. **/dashboard/monitor** – formulário "Registrar Atendimento" (disciplina, data, tópicos) com lista de alunos e checkboxes de presença; tabela de histórico.
4. **/dashboard/aluno** – grade de horários e locais por disciplina; painel "Minhas Presenças".
5. **/dashboard/admin** – Administrador gerencia usuários (criar contas de coordenador, monitor e aluno, alterar perfil, desativar) e acessa todos os painéis.
6. Botão "Sair" em todos os painéis; cada perfil só acessa o próprio painel.

## Acessibilidade
- Barra fixa: A+ / A- (tamanho da fonte), alto contraste, "Ouvir esta página" (leitura em voz do navegador) e botões "ouvir" em cartões principais.
- Link "Pular para o conteúdo", foco visível, rótulos ARIA, anúncios de erros/sucesso para leitores de tela.

## Dados
- Lovable Cloud: contas reais, perfis em tabela separada (ADMIN, COORDENADOR, MONITOR, ALUNO), disciplinas, horários, atendimentos, presenças.
- Dados fictícios do curso de Desenvolvimento de Sistemas já carregados, com contas de teste para cada perfil (credenciais informadas ao final).
- Usuário administrador padrão criado já no início: e-mail `admin@sgma.local`, senha padrão `Admin@123` (recomenda-se trocar após o primeiro acesso).
- Login por matrícula: a matrícula é convertida no e-mail do aluno no servidor, sem expor e-mails.

## Detalhes técnicos
- Rotas protegidas sob `_authenticated`; papel verificado via função `has_role`; regras de acesso por linha (monitor vê só suas disciplinas, aluno só suas presenças).
- Server functions para cadastros e relatório; testes para o redirecionamento por perfil e a mensagem de erro.
