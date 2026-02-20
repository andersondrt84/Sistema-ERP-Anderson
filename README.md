# Sistema leve de assistência técnica (Docker + PostgreSQL)

Projeto backend + interface web para controle de trabalho extra de manutenção de computadores em casa.

## O que este sistema registra
- Cadastro de usuários do sistema (com autenticação).
- Cadastro de pessoas (contatos gerais).
- Cadastro de clientes atendidos.
- Ordens de serviço com:
  - descrição;
  - valor cobrado;
  - tipo de impressora (`laser` e `jato_de_tinta`);
  - marca compatível (`HP` e `Epson`);
  - status (`aberta`, `em_andamento`, `concluida`, `cancelada`).

## Segurança
- Login com JWT (`/api/auth/login`).
- Rotas de cadastro e listagem protegidas por Bearer Token.
- Senhas com hash (`bcrypt`).

## Acesso Web HTTP (sem domínio)
- **HTTP principal na porta 7000**: `http://localhost:7000`
- Também funciona via IP da máquina, por exemplo: `http://192.168.x.x:7000`
- Não precisa domínio para acessar localmente.
- A interface web tem layout moderno com cores vibrantes em gradiente.
- A API fica atrás do Nginx em `/api/*`.
- Documentação da API: `/docs`.

## Correção do erro de deploy (mount no Nginx)
Para evitar o erro `not a directory` no deploy (comum em Portainer/Stacks), o serviço web agora usa **imagem custom do Nginx** com os arquivos copiados no build, em vez de bind mount de `nginx/http.conf`.

## Estrutura
- `docker-compose.yml`: API + PostgreSQL + gateway web HTTP (Nginx).
- `Dockerfile`: imagem da API FastAPI.
- `nginx/Dockerfile`: imagem web (Nginx) com config e frontend embutidos.
- `.env.example`: variáveis de ambiente base.
- `nginx/http.conf`: estático + proxy HTTP para frontend/API.
- `web/index.html` e `web/styles.css`: layout visual do ERP.
- `app/`: código da aplicação.

## Endpoints principais da API (via `/api`)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/people` e `GET /api/people`
- `POST /api/clients` e `GET /api/clients`
- `POST /api/service-orders` e `GET /api/service-orders`
- `GET /api/health`

## Observação
Conforme solicitado, os códigos foram apenas adicionados/atualizados no repositório.
