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

## Acesso Web (HTTP/HTTPS)
- O acesso HTTP fica disponível pelo Nginx em `http://localhost`.
- O acesso HTTPS fica disponível em `https://localhost` via serviço `web-https` (profile `https`).
- O Nginx encaminha as requisições para a API interna (`api:8000`).

## Estrutura
- `docker-compose.yml`: API + PostgreSQL + gateway web (Nginx HTTP/HTTPS).
- `Dockerfile`: imagem da API FastAPI.
- `.env.example`: variáveis de ambiente base.
- `nginx/http.conf`: proxy HTTP para a API.
- `nginx/https.conf`: proxy HTTPS para a API.
- `certs/`: pasta para certificados TLS (`fullchain.pem` e `privkey.pem`).
- `app/`: código da aplicação.

## Endpoints principais
- `POST /auth/register`
- `POST /auth/login`
- `POST /people` e `GET /people`
- `POST /clients` e `GET /clients`
- `POST /service-orders` e `GET /service-orders`
- `GET /health`

## HTTPS (certificados)
Para o serviço `web-https`, coloque os arquivos abaixo em `certs/`:
- `certs/fullchain.pem`
- `certs/privkey.pem`

## Observação
Conforme solicitado, os códigos foram apenas adicionados/atualizados no repositório.
