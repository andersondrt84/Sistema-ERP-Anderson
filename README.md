# Sistema leve de assistência técnica (Docker + PostgreSQL)

Projeto backend + interface web para controle de manutenção de computadores em casa.

## Funcionalidades web
- Login com **configuração inicial do primeiro usuário** (sem credenciais padrão expostas).
- Gerenciamento de usuários para criar novos acessos.
- Alteração de senha para o usuário logado.
- Cadastro de ordens com:
  - número automático da OS;
  - cliente;
  - equipamento;
  - impressora;
  - **tipo de serviço** (Formatação, Instalação do Windows, Configuração de roteador, Conserto, Montagem de computador);
  - descrição;
  - campo para anexar PDF da descrição do serviço;
  - valor cobrado;
  - status (aberto, aguardando cliente, concluido) e data.
- Caixa para lançar valores recebidos.
- Relatórios com total de ordens, clientes atendidos, total cobrado, concluídas, total em caixa, resumo por mês e resumo por tipo de serviço.

## Segurança backend
- Login com JWT (`/api/auth/login`).
- Rotas de cadastro e listagem protegidas por Bearer Token.
- Senhas com hash (`bcrypt`).

## Acesso Web HTTP (sem domínio)
- **HTTP principal na porta 7000**: `http://localhost:7000`
- Também funciona via IP da máquina, por exemplo: `http://192.168.x.x:7000`
- Não precisa domínio para acessar localmente.

## Estrutura
- `docker-compose.yml`: API + PostgreSQL + gateway web HTTP (Nginx).
- `Dockerfile`: imagem da API FastAPI.
- `nginx/Dockerfile`: imagem web (Nginx) com config e frontend embutidos.
- `nginx/http.conf`: estático + proxy HTTP para frontend/API.
- `web/index.html`, `web/styles.css`, `web/app.js`: interface web interativa.
- `app/`: código da API.
