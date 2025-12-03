#!/usr/bin/env bash

set -euo pipefail

BACKUP_DIR="./local/backups"

echo "Creating backup directory at ${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"
touch "${BACKUP_DIR}/.gitkeep"

if ! grep -q "local/backups" .gitignore 2>/dev/null; then
  echo "local/backups/*.sql" >> .gitignore
fi

echo "Backup storage ready at ${BACKUP_DIR}"
echo "Ensure sufficient disk space for backup files."
