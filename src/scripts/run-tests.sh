#!/usr/bin/env bash
set -euo pipefail
echo "DEBUG_PORT=${DEBUG_PORT:-}"

# Wallet to test with (used to fetch the right extension)
WALLET="${WALLET:-metamask}"   # metamask | phantom
EXT_DIR="${EXT_DIR:-/extensions}"
mkdir -p "$EXT_DIR" 2>/dev/null || true

if [ -n "${USER_DATA_DIR:-}" ] && [ -d "$USER_DATA_DIR" ]; then
  echo "→ Scrubbing Chrome singleton locks in $USER_DATA_DIR"
  rm -f "$USER_DATA_DIR/SingletonLock" \
        "$USER_DATA_DIR/SingletonCookie" \
        "$USER_DATA_DIR/SingletonSocket" \
        "$USER_DATA_DIR/DevToolsActivePort" 2>/dev/null || true
fi

# Download the extension only if it's missing
if [ ! -f "$EXT_DIR/$WALLET/manifest.json" ]; then
  echo "→ Downloading $WALLET into $EXT_DIR/$WALLET ..."
  node src/scripts/download-extension.mjs "$WALLET" \
    "$( [ "$WALLET" = "metamask" ] && echo nkbihfbeogaeaoehlefnkodbefgpgknn || echo bfnaelmomeimhlpmgjnjophhpkkoljpa )"
fi

if [ ! -f "$EXT_DIR/$WALLET/manifest.json" ]; then
  echo "✖ Extension not present at $EXT_DIR/$WALLET/manifest.json" >&2
  exit 1
fi

echo "✔ Extension present: $EXT_DIR/$WALLET/manifest.json"
echo "✔ Using baked profile from: ${USER_DATA_DIR}"

if [ "${HEADFUL:-0}" = "1" ]; then
  export DISPLAY=:99
  Xvfb :99 -screen 0 1920x1080x24 -ac >/dev/null 2>&1 &
  fluxbox >/dev/null 2>&1 &

  if [ "${VNC:-0}" = "1" ]; then
    VNC_PORT="${VNC_PORT:-5900}"
    if [ -n "${VNC_PASSWORD:-}" ]; then
      PASS_FILE=/tmp/x11vnc.pass
      x11vnc -storepasswd "${VNC_PASSWORD}" "$PASS_FILE" >/dev/null 2>&1
      VNC_AUTH_OPTS="-rfbauth $PASS_FILE"
    else
      VNC_AUTH_OPTS="-nopw"   # falls back to no password (macOS may reject)
    fi
    x11vnc -display :99 -rfbport "$VNC_PORT" -forever -shared $VNC_AUTH_OPTS \
      -o /tmp/x11vnc.log >/dev/null 2>&1 &
    echo "VNC listening on :$VNC_PORT"
  fi
fi
# Run Playwright tests; pass through any args you put after the image name
exec npx playwright test "$@"
