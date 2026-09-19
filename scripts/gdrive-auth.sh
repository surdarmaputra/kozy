#!/usr/bin/env bash
# One-time Google Drive OAuth bootstrap, run entirely from this container.
#
#   export GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=...
#   ./scripts/gdrive-auth.sh url            # open the printed URL, approve
#   ./scripts/gdrive-auth.sh token <code>   # prints the rclone token JSON
set -euo pipefail

REDIRECT="http://localhost"
SCOPE="https://www.googleapis.com/auth/drive"

: "${GOOGLE_CLIENT_ID:?GOOGLE_CLIENT_ID is not set}"

case "${1:-}" in
url)
  python3 - "$GOOGLE_CLIENT_ID" "$REDIRECT" "$SCOPE" <<'PY'
import sys, urllib.parse
cid, redirect, scope = sys.argv[1:4]
q = urllib.parse.urlencode({
    'client_id': cid,
    'redirect_uri': redirect,
    'response_type': 'code',
    'scope': scope,
    'access_type': 'offline',
    'prompt': 'consent',
})
print('https://accounts.google.com/o/oauth2/v2/auth?' + q)
PY
  ;;
token)
  : "${GOOGLE_CLIENT_SECRET:?GOOGLE_CLIENT_SECRET is not set}"
  code="${2:?usage: gdrive-auth.sh token <code>}"
  curl -sS https://oauth2.googleapis.com/token \
    -d client_id="$GOOGLE_CLIENT_ID" \
    -d client_secret="$GOOGLE_CLIENT_SECRET" \
    -d code="$code" \
    -d redirect_uri="$REDIRECT" \
    -d grant_type=authorization_code |
    python3 -c '
import datetime, json, sys
r = json.load(sys.stdin)
if "refresh_token" not in r:
    sys.exit("no refresh_token in response: " + json.dumps(r))
expiry = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=r["expires_in"])
print(json.dumps({
    "access_token": r["access_token"],
    "token_type": "Bearer",
    "refresh_token": r["refresh_token"],
    "expiry": expiry.isoformat().replace("+00:00", "Z"),
}))
'
  ;;
*)
  echo "usage: gdrive-auth.sh url | token <code>" >&2
  exit 1
  ;;
esac
