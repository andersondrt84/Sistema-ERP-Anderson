#!/usr/bin/env bash
set -euo pipefail

# Backup do PostgreSQL (container Docker) e envio para Google Drive via rclone.
# Modos de envio:
#   - Host: usa rclone instalado na máquina
#   - Container: usa serviço `rclone` no docker compose (profile backup)
#
# Variáveis customizáveis por ambiente:
#   DB_CONTAINER_SERVICE (default: db)
#   DB_NAME             (default: erp_db)
#   DB_USER             (default: erp_user)
#   BACKUP_DIR          (default: ./backups)
#   RCLONE_REMOTE       (default: gdrive)
#   RCLONE_PATH         (default: ERP-Backups/postgres)
#   RCLONE_IN_CONTAINER (default: auto) [auto|1|0]

DB_CONTAINER_SERVICE="${DB_CONTAINER_SERVICE:-db}"
DB_NAME="${DB_NAME:-erp_db}"
DB_USER="${DB_USER:-erp_user}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive}"
RCLONE_PATH="${RCLONE_PATH:-ERP-Backups/postgres}"
RCLONE_IN_CONTAINER="${RCLONE_IN_CONTAINER:-auto}"

TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}" ./rclone

echo "[1/3] Gerando dump compactado: ${BACKUP_FILE}"
docker compose exec -T "${DB_CONTAINER_SERVICE}" \
  pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"

use_container_rclone=false
if [[ "${RCLONE_IN_CONTAINER}" == "1" ]]; then
  use_container_rclone=true
elif [[ "${RCLONE_IN_CONTAINER}" == "0" ]]; then
  use_container_rclone=false
elif ! command -v rclone >/dev/null 2>&1; then
  use_container_rclone=true
fi

if [[ "${use_container_rclone}" == true ]]; then
  echo "[2/3] Enviando via rclone no container: ${RCLONE_REMOTE}:${RCLONE_PATH}"
  docker compose run --rm --profile backup \
    -v "$(pwd)/rclone:/config/rclone" \
    -v "$(pwd)/backups:/backups" \
    rclone copy "/backups/$(basename "${BACKUP_FILE}")" "${RCLONE_REMOTE}:${RCLONE_PATH}" --progress

  echo "[3/3] Verificando arquivo remoto"
  docker compose run --rm --profile backup \
    -v "$(pwd)/rclone:/config/rclone" \
    -v "$(pwd)/backups:/backups" \
    rclone ls "${RCLONE_REMOTE}:${RCLONE_PATH}" | tail -n 5
else
  echo "[2/3] Enviando via rclone no host: ${RCLONE_REMOTE}:${RCLONE_PATH}"
  rclone copy "${BACKUP_FILE}" "${RCLONE_REMOTE}:${RCLONE_PATH}" --progress

  echo "[3/3] Verificando arquivo remoto"
  rclone ls "${RCLONE_REMOTE}:${RCLONE_PATH}" | tail -n 5
fi

echo "Backup concluído com sucesso: ${BACKUP_FILE}"
