# Sistema leve de assistência técnica (Docker + PostgreSQL)

Projeto backend + interface web para controle de manutenção de computadores em casa.

## Funcionalidades web
- Login na interface com usuário padrão `anderson` e senha padrão `12345678`.
- Opção de **alteração de senha** na própria interface.
- Cadastro clicável de ordens de serviço com:
  - cliente;
  - equipamento;
  - impressora compatível;
  - descrição;
  - valor cobrado;
  - status;
  - data.
- Relatórios rápidos com total de ordens, total cobrado e ordens concluídas.
- Dados salvos no navegador (LocalStorage) para uso prático do painel web.

## Segurança backend
- Login com JWT (`/api/auth/login`).
- Rotas de cadastro e listagem protegidas por Bearer Token.
- Senhas com hash (`bcrypt`).

## Acesso Web HTTP (sem domínio)
- **HTTP principal na porta 7000**: `http://localhost:7000`
- Também funciona via IP da máquina, por exemplo: `http://192.168.x.x:7000`
- Não precisa domínio para acessar localmente.

## Correção do erro de deploy (mount no Nginx)
Para evitar o erro `not a directory` no deploy (Portainer/Stacks), o serviço web usa **imagem custom do Nginx** com arquivos copiados no build, sem bind mount de arquivo de configuração.

## Estrutura
- `docker-compose.yml`: API + PostgreSQL + gateway web HTTP (Nginx).
- `Dockerfile`: imagem da API FastAPI.
- `nginx/Dockerfile`: imagem web (Nginx) com config e frontend embutidos.
- `nginx/http.conf`: estático + proxy HTTP para frontend/API.
- `web/index.html`, `web/styles.css`, `web/app.js`: interface web interativa.
- `app/`: código da API.

## Endpoints principais da API (via `/api`)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/people` e `GET /api/people`
- `POST /api/clients` e `GET /api/clients`
- `POST /api/service-orders` e `GET /api/service-orders`
- `GET /api/health`
