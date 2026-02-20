# Sistema leve de assistência técnica (Docker + PostgreSQL)

Projeto backend para controle de trabalho extra de manutenção de computadores em casa.

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
- Login com JWT (`/auth/login`).
- Rotas de cadastro e listagem protegidas por Bearer Token.
- Senhas com hash (`bcrypt`).

## Estrutura
- `docker-compose.yml`: API + PostgreSQL.
- `Dockerfile`: imagem da API FastAPI.
- `.env.example`: variáveis de ambiente base.
- `app/`: código da aplicação.

## Endpoints principais
- `POST /auth/register`
- `POST /auth/login`
- `POST /people` e `GET /people`
- `POST /clients` e `GET /clients`
- `POST /service-orders` e `GET /service-orders`
- `GET /health`

## Observação
Conforme solicitado, os códigos foram apenas adicionados/atualizados no repositório.
