#!/usr/bin/env bash
set -euo pipefail

# Backup do PostgreSQL (container Docker) e envio para Google Drive via rclone.
# Requisitos:
#   - docker compose
#   - rclone configurado (remote padrão: gdrive)
#
# Variáveis customizáveis por ambiente:
#   DB_CONTAINER_SERVICE (default: db)
#   DB_NAME             (default: erp_db)
#   DB_USER             (default: erp_user)
#   BACKUP_DIR          (default: ./backups)
#   RCLONE_REMOTE       (default: gdrive)
#   RCLONE_PATH         (default: ERP-Backups/postgres)

DB_CONTAINER_SERVICE="${DB_CONTAINER_SERVICE:-db}"
DB_NAME="${DB_NAME:-erp_db}"
DB_USER="${DB_USER:-erp_user}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive}"
RCLONE_PATH="${RCLONE_PATH:-ERP-Backups/postgres}"

TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[1/3] Gerando dump compactado: ${BACKUP_FILE}"
docker compose exec -T "${DB_CONTAINER_SERVICE}" \
  pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"

echo "[2/3] Enviando para Google Drive: ${RCLONE_REMOTE}:${RCLONE_PATH}"
rclone copy "${BACKUP_FILE}" "${RCLONE_REMOTE}:${RCLONE_PATH}" --progress

echo "[3/3] Verificando arquivo remoto"
rclone ls "${RCLONE_REMOTE}:${RCLONE_PATH}" | tail -n 5

echo "Backup concluído com sucesso: ${BACKUP_FILE}"
