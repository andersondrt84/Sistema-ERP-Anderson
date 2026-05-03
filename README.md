# Gestão TI - Assistência Técnica (Docker + PostgreSQL)

Projeto backend + interface web para controle de manutenção de computadores em casa, com layout mais simples e claro, fundo em cinza médio e login em duas colunas (marca e autenticação).

## Funcionalidades web
- Login para qualquer usuário existente no banco de dados (via API `/api/auth/login`).
- Login com usuário e senha cadastrados no banco.
- Usuário master criado automaticamente: `admin` com senha `12345678`.
- Ajustes do sistema reservados para o usuário `anderson` na interface.
- Botão de logout para encerrar sessão com segurança.
- Cadastro de ordens com:
  - número automático da OS;
  - cliente;
  - equipamento;
  - impressora;
  - **tipo de serviço** (Formatação, Instalação do Windows, Configuração de roteador, Conserto, Montagem de computador);
  - descrição;
  - geração automática do documento da OS em PDF ao salvar;
  - opção de imprimir em impressora do sistema e salvar PDF;
  - valor cobrado;
  - status (aberto, aguardando cliente, concluido) e data.
- Caixa para lançar valores recebidos.
- Relatórios com total de ordens, clientes atendidos, total cobrado, concluídas, total em caixa, resumo por mês e resumo por tipo de serviço.
- Compatibilidade de linguagens de impressão no cadastro da OS:
  - Epson: ESC/P, ESC/P-R, ESC/P2, ESC/POS;
  - HP: PCL 5/5e/5c, PCL 6 (PCL XL), PostScript (PS), PCLm / PCLmS;
  - Bematech: ESC/POS, ESC/Bematech, Protocolo Direto (Spooler/DLL).

## Segurança backend
- Login com JWT (`/api/auth/login`).
- Rotas de cadastro e listagem protegidas por Bearer Token.
- Senhas com hash (`bcrypt`).

## Acesso Web HTTP (sem domínio)
- **HTTP principal na porta 7000**: `http://localhost:7000`
- Também funciona via IP da máquina, por exemplo: `http://192.168.x.x:7000`
- Não precisa domínio para acessar localmente.

## Desenvolvimento local rápido (sem Docker)
1. Crie e ative um ambiente virtual Python.
2. Instale dependências com `pip install -r requirements.txt`.
3. Suba a API com `uvicorn app.main:app --reload --port 8000`.
4. Em outro terminal, sirva os arquivos estáticos com `python -m http.server 7000 -d web`.
5. Acesse `http://localhost:7000`.


## Backup do banco no Google Drive (automatizado)

### 1) Conectar Google Drive ao container (sem instalar rclone no host)
O projeto inclui o serviço `rclone` no `docker-compose` (profile `backup`) e o script:

```bash
./scripts/connect_gdrive_in_container.sh
```

Esse comando abre o `rclone config` dentro de container e salva a configuração em `./rclone/rclone.conf`.
Na configuração, crie um remote chamado `gdrive`.

Teste rápido:
```bash
docker compose run --rm --profile backup -v "$(pwd)/rclone:/config/rclone" rclone lsd gdrive:
```

### 2) Gerar backup e enviar para Drive
Exemplo de execução manual:
```bash
./scripts/backup_postgres_to_gdrive.sh
```

Variáveis opcionais:
```bash
DB_CONTAINER_SERVICE=db
DB_NAME=erp_db
DB_USER=erp_user
BACKUP_DIR=./backups
RCLONE_REMOTE=gdrive
RCLONE_PATH=ERP-Backups/postgres
RCLONE_IN_CONTAINER=auto
```

- `RCLONE_IN_CONTAINER=auto`: usa rclone do host se existir; caso contrário usa container.
- `RCLONE_IN_CONTAINER=1`: força uso do container.
- `RCLONE_IN_CONTAINER=0`: força uso do host.

Exemplo forçando container:
```bash
RCLONE_IN_CONTAINER=1 RCLONE_PATH=Empresa/ERP ./scripts/backup_postgres_to_gdrive.sh
```

### 3) Agendar backup automático no Linux (cron)
Editar crontab:
```bash
crontab -e
```

Backup diário às 02:30 (forçando rclone no container):
```cron
30 2 * * * cd /caminho/Sistema-ERP-Anderson && RCLONE_IN_CONTAINER=1 /bin/bash ./scripts/backup_postgres_to_gdrive.sh >> ./backups/backup.log 2>&1
```

### 4) (Opcional) Política de retenção local
Para manter somente os 15 backups mais recentes localmente:
```bash
ls -1t ./backups/*.sql.gz | tail -n +16 | xargs -r rm -f
```

## Estrutura
- `docker-compose.yml`: API + PostgreSQL + gateway web HTTP (Nginx).
- `Dockerfile`: imagem da API FastAPI.
- `nginx/Dockerfile`: imagem web (Nginx) com config e frontend embutidos.
- `nginx/http.conf`: estático + proxy HTTP para frontend/API.
- `web/index.html`, `web/styles.css`, `web/app.js`: interface web interativa.
- `app/`: código da API.
