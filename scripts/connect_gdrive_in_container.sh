#!/usr/bin/env bash
set -euo pipefail

# Configura o Google Drive usando rclone dentro de container.
# Salva config em ./rclone/rclone.conf (montado no container).

mkdir -p ./rclone ./backups

echo "Abrindo assistente interativo do rclone dentro do container..."
echo "Sugestão: crie um remote chamado 'gdrive'."

docker compose run --rm --profile backup \
  -v "$(pwd)/rclone:/config/rclone" \
  -v "$(pwd)/backups:/backups" \
  rclone config

echo "Configuração finalizada. Teste listando remotes:"
docker compose run --rm --profile backup \
  -v "$(pwd)/rclone:/config/rclone" \
  -v "$(pwd)/backups:/backups" \
  rclone listremotes
