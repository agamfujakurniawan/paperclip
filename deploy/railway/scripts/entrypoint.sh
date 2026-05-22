#!/bin/sh
set -e

# Railway volumes mounted at /paperclip are not guaranteed to be writable by
# the node user. Paperclip stores config, auth, logs, Codex state, and local
# runtime data under this persistent root.
mkdir -p /paperclip/instances/default/logs
chown -R node:node /paperclip

# Drop root and all inherited capabilities. Claude Code rejects runs that look
# elevated even after a plain uid/gid drop; setpriv makes the child genuinely
# unprivileged while keeping the /paperclip volume prepared.
unset SUDO_USER SUDO_UID SUDO_GID SUDO_COMMAND 2>/dev/null || true

exec setpriv \
  --reuid=node \
  --regid=node \
  --init-groups \
  --inh-caps=-all \
  "$@"
