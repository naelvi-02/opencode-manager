#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SUDO=""
if [ "$EUID" -ne 0 ]; then
  SUDO="sudo"
fi
$SUDO ln -sf "$DIR/server.js" /usr/local/bin/opencode-manager
$SUDO chmod +x "$DIR/server.js" "$DIR/cli.js"
echo "OpenCode Manager installed to /usr/local/bin/opencode-manager"
