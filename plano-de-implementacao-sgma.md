# Plano de Implementação – Módulo de Autenticação e Gestão de Monitoria (SGMA)

## 1. Contexto & Perfis de Usuário
- **Objetivo do ciclo**: Estruturar e implementar a camada inicial do **Sistema de Gestão de Monitoria Acadêmica (SGMA)**, garantindo a autenticação segura de usuários com controle de acesso baseado em perfil e viabilizando a gestão básica de disciplinas, monitores, atendimentos, frequência e recursos de acessibilidade.
- **Restrições técnicas e requisitos não funcionais**:
  - **Autenticação & Roteamento**: O sistema deve consultar o banco de dados para identificar o perfil do usuário no momento do login e redirecioná-lo automaticamente para seu painel (Dashboard) correspondente.
  - **Segurança da Interface (UI)**: O campo de senha deve obrigatoriamente mascarar os caracteres (* ou •) e disponibilizar um ícone de "olho" para alternar a visibilidade da senha.
  - **Tratamento de Exceções**: Tentativas de autenticação com dados incorretos devem retornar exatamente a mensagem de erro "E-mail ou senha inválidos".
  - **Acessibilidade Universal**: A interface deve ser compatível com leitores de tela e fornecer descrições auditivas dos conteúdos e funcionalidades do sistema (US-C11, US-C12).
- **Perfis envolvidos**:
  - **Coordenador Acadêmico**: Responsável pelo cadastro e gestão de monitores e disciplinas com monitoria, acompanhamento de desempenho e emissão de relatórios.
  - **Monitor**: Responsável pelo registro de atendimentos efetuados e controle de frequência/presença dos alunos.
  - **Aluno (incluindo Alunos com deficiência visual)**: Responsável por consultar horários de atendimento disponíveis e acompanhar o próprio histórico de presenças.

## 2. Histórias de Usuário do Ciclo
| ID | História (Como... Quero... Para...) | Prioridade | Fonte |
|----|-------------------------------------|------------|-------|
| **US-C10 / E01H01** | **Como** Usuário (Coordenador, Monitor ou Aluno), **quero** realizar login utilizando minhas credenciais (E-mail/Matrícula e Senha), **para** acessar as funcionalidades de acordo com meu perfil. | Alta | E01H01 / Product Backlog |
| **US-C01** | **Como** Coordenador Acadêmico, **quero** cadastrar e gerenciar monitores no sistema, **para** organizar e controlar as monitorias oferecidas pela instituição. | Alta | Product Backlog |
| **US-C07** | **Como** Coordenador Acadêmico, **quero** cadastrar disciplinas que possuem monitoria, **para** identificar corretamente os responsáveis por cada monitoria. | Alta | Product Backlog |
| **US-C09** | **Como** Coordenador Acadêmico, **quero** visualizar os monitores cadastrados, **para** facilitar o gerenciamento das equipes de monitoria. | Média | Product Backlog |
| **US-C02** | **Como** Monitor, **quero** registrar a presença dos alunos nas monitorias, **para** controlar a frequência dos participantes. | Alta | Product Backlog |
| **US-C03** | **Como** Monitor, **quero** registrar os atendimentos realizados, **para** manter um histórico das atividades desenvolvidas. | Alta | Product Backlog |
| **US-C04** | **Como** Coordenador Acadêmico, **quero** acompanhar as atividades realizadas pelos monitores, **para** avaliar o desempenho das monitorias. | Média | Product Backlog |
| **US-C05** | **Como** Aluno, **quero** consultar os horários das monitorias, **para** participar dos atendimentos disponíveis. | Alta | Product Backlog |
| **US-C08** | **Como** Aluno, **quero** consultar minhas presenças nas monitorias, **para** acompanhar minha participação. | Média | Product Backlog |
| **US-C06** | **Como** Coordenador Acadêmico, **quero** gerar relatórios de frequência e atendimentos, **para** acompanhar os resultados das monitorias. | Média | Product Backlog |
| **US-C11** | **Como** Aluno com deficiência visual, **quero** utilizar o sistema com leitores de tela e recursos de acessibilidade, **para** acessar as informações das monitorias com autonomia. | Alta | Product Backlog |
| **US-C12** | **Como** Aluno com deficiência visual, **quero** ouvir descrições dos conteúdos e funcionalidades do sistema, **para** compreender e utilizar todos os recursos disponíveis sem depender de terceiros. | Média | Product Backlog |

## 3. Histórias Propostas [PROPOSTA] (Se houver lacunas)
| ID | História | Justificativa de Dependência |
|----|----------|------------------------------|
| **US-P01** | **Como** Usuário autenticado, **quero** realizar logout do sistema com um clique, **para** encerrar minha sessão com segurança. | **Segurança & Sessão**: Necessária para complementar a US-C10/E01H01, garantindo que o usuário possa deslogar e impedir acessos não autorizados no mesmo navegador. |
| **US-P02** | **Como** Administrador do Sistema / Coordenador, **quero** cadastrar e importar dados de alunos e matrículas, **para** permitir a validação de presença e login de alunos. | **Persistência de Usuários**: A história US-C02 exige vincular presenças a alunos existentes, demandando uma base prévia de estudantes no sistema. |
| **US-P03** | **Como** Coordenador Acadêmico, **quero** vincular monitores e horários a disciplinas específicas, **para** disponibilizar a grade para consulta dos alunos. | **Vínculo Operacional**: Relaciona US-C01, US-C07 e US-C05, permitindo que a consulta de horários liste o monitor e o local correto. |

## 4. Critérios de Aceite Detalhados

### E01H01 / US-C10 – Autenticar no Sistema
- **CA01: Login com sucesso**
  - **Dado** que o usuário está na tela de login;
  - **Quando** ele preenche credenciais corretas (E-mail ou Matrícula e Senha) e clica em "Entrar";
  - **Então** o sistema deve autenticá-lo e redirecioná-lo para seu respectivo painel (Dashboard do Coordenador, Monitor ou Aluno).
- **CA02: Falha na autenticação**
  - **Dado** que o usuário tenta logar;
  - **Quando** ele insere credenciais incorretas;
  - **Então** o sistema deve exibir a mensagem "E-mail ou senha inválidos".
- **CA03: Alternância de visibilidade da senha**
  - **Dado** que o usuário está digitando sua senha no campo correspondente;
  - **Quando** ele clica no ícone de "olho";
  - **Então** o sistema deve revelar os caracteres da senha, e ao clicar novamente, voltar a mascará-los com (* ou •).

### US-C01 – Cadastrar e Gerenciar Monitores
- **CA01: Cadastro de monitor realizado com sucesso**
  - **Dado** que o Coordenador Acadêmico está na tela de gestão de monitores;
  - **Quando** ele preenche a Matrícula/E-mail do aluno, seleciona a disciplina vinculada e clica em "Salvar";
  - **Então** o sistema armazena a atribuição de monitoria e exibe a mensagem "Monitor cadastrado com sucesso".
- **CA02: Tentativa de cadastro com campos obrigatórios ausentes**
  - **Dado** que o Coordenador está no formulário de cadastro de monitor;
  - **Quando** ele clica em "Salvar" sem selecionar a disciplina ou sem informar o aluno;
  - **Então** o sistema impede a submissão e destaca os campos obrigatórios não preenchidos.

### US-C02 / US-C03 – Registrar Atendimentos e Presença
- **CA01: Registro de atendimento e frequência efetuado**
  - **Dado** que o Monitor está autenticado em seu painel;
  - **Quando** ele seleciona a data, informa a descrição das atividades do atendimento e marca a presença dos alunos participantes;
  - **Então** o sistema salva o registro de atendimento no histórico e atualiza a contagem de presença dos alunos.

### US-C05 – Consultar Horários das Monitorias
- **CA01: Visualização de horários de atendimento**
  - **Dado** que o Aluno está logado no sistema;
  - **Quando** ele acessa a tela de consulta de monitorias;
  - **Então** o sistema exibe a lista de disciplinas, nomes dos monitores responsáveis, dias da semana, horários e locais de atendimento.

### US-C11 / US-C12 – Acessibilidade e Leitor de Tela
- **CA01: Compatibilidade com tecnologias assistivas**
  - **Dado** que um Aluno com deficiência visual acessa o sistema utilizando um leitor de tela;
  - **Quando** ele navega pelos elementos da interface (campos de formulário, botões, tabelas de horários);
  - **Então** o sistema fornece rótulos acessíveis (ARIA attributes), leitor de contexto e áudiodescrições sem bloquear a navegação teclado/voz.

## 5. Arquitetura de Banco de Dados Relacional

```sql
-- =============================================================================
-- SCRIPT SQL DDL - BANCO DE DADOS RELACIONAL (PostgreSQL / Supabase)
-- Sistema de Gestão de Monitoria Acadêmica (SGMA)
-- =============================================================================

-- 1. Criação de Enums de Status e Perfis
CREATE TYPE perfil_usuario AS ENUM ('COORDENADOR', 'MONITOR', 'ALUNO');
CREATE TYPE status_monitoria AS ENUM ('ATIVO', 'INATIVO', 'CONCLUIDO');

-- 2. Tabela de Usuários (Centraliza credenciais e perfis)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    matricula VARCHAR(50) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil perfil_usuario NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Disciplinas
CREATE TABLE disciplinas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(150) NOT NULL,
    coordenador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Monitores (Vínculo entre usuário e disciplina)
CREATE TABLE monitores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
    status status_monitoria DEFAULT 'ATIVO',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_monitor_disciplina UNIQUE (usuario_id, disciplina_id)
);

-- 5. Tabela de Horários de Monitoria
CREATE TABLE horarios_monitoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id UUID NOT NULL REFERENCES monitores(id) ON DELETE CASCADE,
    dia_semana VARCHAR(20) NOT NULL, -- Ex: 'Segunda-feira', 'Tarde'
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    local VARCHAR(100) NOT NULL
);

-- 6. Tabela de Registros de Atendimentos
CREATE TABLE atendimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id UUID NOT NULL REFERENCES monitores(id) ON DELETE CASCADE,
    data_atendimento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    conteudo_trabalhado TEXT NOT NULL,
    observacoes TEXT
);

-- 7. Tabela de Presenças nas Monitorias
CREATE TABLE presencas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atendimento_id UUID NOT NULL REFERENCES atendimentos(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    presente BOOLEAN DEFAULT TRUE,
    CONSTRAINT unique_presenca_atendimento UNIQUE (atendimento_id, aluno_id)
);

-- =============================================================================
-- CARGA INICIAL DE DADOS (SEED DATA / CREDENCIAIS DE TESTE)
-- =============================================================================

INSERT INTO usuarios (id, nome, email, matricula, senha_hash, perfil) VALUES
('11111111-1111-1111-1111-111111111111', 'Prof. Alexandre Valle', 'coordenador@iftm.edu.br', 'COORD001', '$2a$10$e83...senha123hash', 'COORDENADOR'),
('22222222-2222-2222-2222-222222222222', 'Guilherme Rodrigues', 'monitor@iftm.edu.br', 'MON202601', '$2a$10$e83...senha123hash', 'MONITOR'),
('33333333-3333-3333-3333-333333333333', 'Amanda Nicolle', 'aluno@iftm.edu.br', 'ALU202602', '$2a$10$e83...senha123hash', 'ALUNO');

INSERT INTO disciplinas (id, codigo, nome, coordenador_id) VALUES
('44444444-4444-4444-4444-444444444444', 'DS-01', 'Desenvolvimento de Sistemas', '11111111-1111-1111-1111-111111111111');

INSERT INTO monitores (id, usuario_id, disciplina_id, status) VALUES
('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'ATIVO');

INSERT INTO horarios_monitoria (monitor_id, dia_semana, hora_inicio, hora_fim, local) VALUES
('55555555-5555-5555-5555-555555555555', 'Segunda-feira', '14:00:00', '16:00:00', 'Laboratório de Informática 02');
```

## 6. Prompt Estruturado para o Gerador de Protótipo (Figma Make / Lovable)

```text
Você é um designer de interfaces UI/UX e desenvolvedor frontend especialista. Crie uma aplicação web responsiva e acessível para o "Sistema de Gestão de Monitoria Acadêmica (SGMA)" do IFTM Campus Uberaba Parque Tecnológico.

### 1. IDIOMA E ACESSIBILIDADE
- Toda a interface deve estar rigorosamente em Português (Brasil).
- A aplicação deve seguir diretrizes da WCAG 2.1 (nível AA), com alto contraste, suporte a navegação por teclado, rótulos ARIA para leitores de tela e botões dedicados para ajuste de fonte e leitura audível de conteúdos (para atender alunos com deficiência visual).

### 2. LISTA DE TELAS E FLUXO DE NAVEGAÇÃO
- Tela 1: Login Centralizado (/login)
  - Formulário contendo: Campo "E-mail ou Matrícula", Campo "Senha" (com mascaramento de caracteres e botão de ícone de olho para revelar/ocultar senha) e botão "Entrar".
  - Ao autenticar, ler o perfil do usuário e redirecionar para a Dashboard correspondente.
- Tela 2: Dashboard do Coordenador (/dashboard/coordenador)
  - Visão geral com métricas de monitorias.
  - Abas/Seções para: "Cadastrar Disciplina", "Cadastrar/Gerenciar Monitores", "Acompanhar Atividades" e "Exportar Relatórios de Frequência".
- Tela 3: Dashboard do Monitor (/dashboard/monitor)
  - Formulário rápido para "Registrar Atendimento" (data, tópicos abordados) e lista de presenças dos alunos com checkboxes.
  - Tabela com histórico de atendimentos realizados.
- Tela 4: Dashboard do Aluno (/dashboard/aluno)
  - Lista/Grid de consulta de horários e locais de monitoria por disciplina.
  - Painel "Minhas Presenças" mostrando o histórico de frequências registradas.

### 3. REGRAS DE PERSISTÊNCIA E LÓGICA DE NEGÓCIO
- Três perfis de acesso: COORDENADOR, MONITOR e ALUNO.
- Validação de Login: Se o usuário inserir credenciais incorretas, exibir exatamente o alerta em vermelho: "E-mail ou senha inválidos".
- O mascaramento de senha deve funcionar dinamicamente ao clicar no ícone de olho.
- Os dados exibidos nas tabelas devem ser populados com dados fictícios verossímeis (Ex: Alunos e Monitores do curso de Desenvolvimento de Sistemas).

### 4. GUIA DE ESTILO E DESIGN SYSTEM
- Paleta de Cores: Verde institucional IFTM (#006633), Cinza neutro (#F4F6F8) e detalhes em Azul escuro (#1E293B).
- Tipografia limpa e legível (Inter ou Roboto).
- Componentes modernos estilo TailwindCSS / Shadcn UI.
```
