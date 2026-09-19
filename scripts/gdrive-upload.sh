#!/usr/bin/env bash
# Upload a file to a Google Drive folder via rclone.
#
# Requires rclone and RCLONE_CONFIG_GDRIVE_TOKEN (see README).
# Re-uploading the same filename replaces the existing file.
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "usage: gdrive-upload.sh <file> <folder-id>" >&2
  exit 1
fi

: "${RCLONE_CONFIG_GDRIVE_TOKEN:?RCLONE_CONFIG_GDRIVE_TOKEN is not set}"
export RCLONE_CONFIG_GDRIVE_TYPE=drive

rclone copyto "$1" "gdrive:$(basename "$1")" --drive-root-folder-id "$2"
