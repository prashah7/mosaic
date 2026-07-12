#!/usr/bin/env bash
set -euo pipefail

mkdir -p /opt/data/skills/mosaic-project-manager
cp /opt/luci/SOUL.md /opt/data/SOUL.md
cp /opt/luci/skills/mosaic-project-manager/SKILL.md /opt/data/skills/mosaic-project-manager/SKILL.md

export API_SERVER_ENABLED=true
export API_SERVER_HOST=0.0.0.0
export API_SERVER_PORT="${PORT:-8642}"

exec /init /opt/hermes/bin/hermes gateway run
