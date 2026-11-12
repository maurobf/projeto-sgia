# E01H01 – Autenticar no sistema



Como Usuário (Coordenador, Monitor ou Aluno), quero realizar login utilizando minhas credenciais, para acessar as funcionalidades de acordo com meu perfil.

**Regras de Negócio / UI:**

- A tela deve conter os campos obrigatórios: E-mail (ou Matrícula) e Senha.
- O campo de senha deve mascarar os caracteres (\* ou •), possuindo um ícone de “olho” para revelar/ocultar.
- O sistema deve identificar o perfil no banco de dados e rotear para o painel (Dashboard) correto.

**Critérios de Aceite:**

- **CA01: Login com sucesso** — Dado que o usuário está na tela de login; quando ele preenche credenciais corretas e clica em “Entrar”; então o sistema deve autenticá-lo e redirecioná-lo para seu respectivo painel.
- **CA02: Falha na autenticação** — Dado que o usuário tenta logar; quando ele insere credenciais incorretas; então o sistema deve exibir “E-mail ou senha inválidos”.
