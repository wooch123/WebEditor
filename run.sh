#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-5173}"
SKIP_INSTALL="${SKIP_INSTALL:-0}"
SKIP_BUILD="${SKIP_BUILD:-0}"
BUILD_ONLY=0

log() {
  printf '[Layout Lab] %s\n' "$*"
}

fail() {
  printf '[Layout Lab] 오류: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
사용법: ./run.sh [옵션]

옵션:
  --host HOST       서비스 바인딩 주소 (기본값: 0.0.0.0)
  --port PORT       서비스 포트 (기본값: 5173)
  --skip-install    npm 패키지 설치 생략
  --skip-build      프로덕션 빌드 생략
  --build-only      빌드까지만 수행하고 서버는 실행하지 않음
  -h, --help        도움말 표시

환경 변수 HOST, PORT, SKIP_INSTALL=1, SKIP_BUILD=1도 사용할 수 있습니다.
EOF
}

while (($#)); do
  case "$1" in
    --host)
      (($# >= 2)) || fail '--host 값이 필요합니다.'
      HOST="$2"
      shift 2
      ;;
    --port)
      (($# >= 2)) || fail '--port 값이 필요합니다.'
      PORT="$2"
      shift 2
      ;;
    --skip-install)
      SKIP_INSTALL=1
      shift
      ;;
    --skip-build)
      SKIP_BUILD=1
      shift
      ;;
    --build-only)
      BUILD_ONLY=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "알 수 없는 옵션: $1"
      ;;
  esac
done

[[ "$PORT" =~ ^[0-9]+$ ]] || fail 'PORT는 숫자여야 합니다.'
((PORT >= 1 && PORT <= 65535)) || fail 'PORT는 1~65535 범위여야 합니다.'

as_root() {
  if ((EUID == 0)); then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    fail 'Node.js 자동 설치에는 root 권한 또는 sudo가 필요합니다.'
  fi
}

node_version_supported() {
  command -v node >/dev/null 2>&1 &&
    node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major > 22 || (major === 22 && minor >= 13) ? 0 : 1)'
}

install_node() {
  command -v apt-get >/dev/null 2>&1 || fail 'Ubuntu의 apt-get을 찾을 수 없습니다. Node.js 22.13 이상을 직접 설치해 주세요.'

  log 'Node.js 22 설치 준비 중...'
  as_root apt-get update
  as_root apt-get install -y ca-certificates curl gnupg

  local key_file
  key_file="$(mktemp)"
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key -o "$key_file"
  as_root install -d -m 0755 /etc/apt/keyrings
  as_root gpg --dearmor --yes --output /etc/apt/keyrings/nodesource.gpg "$key_file"
  rm -f -- "$key_file"
  printf '%s\n' 'deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main' |
    as_root tee /etc/apt/sources.list.d/nodesource.list >/dev/null
  as_root apt-get update
  as_root apt-get install -y nodejs
}

cd "$PROJECT_DIR"

if ! node_version_supported; then
  install_node
fi

node_version_supported || fail 'Node.js 22.13 이상 설치를 확인할 수 없습니다.'
command -v npm >/dev/null 2>&1 || fail 'npm을 찾을 수 없습니다.'
[[ -f package.json ]] || fail "package.json이 없습니다: $PROJECT_DIR"

log "Node.js $(node --version), npm $(npm --version) 사용"
mkdir -p .wrangler logs

if [[ "$SKIP_INSTALL" != '1' ]]; then
  if [[ -f package-lock.json ]]; then
    log '패키지 설치 중...'
    npm ci --include=dev --no-audit --no-fund
  else
    log 'package-lock.json이 없어 npm install을 실행합니다.'
    npm install --include=dev --no-audit --no-fund
  fi
fi

if [[ "$SKIP_BUILD" != '1' ]]; then
  log '프로덕션 빌드 중...'
  npm run build
fi

[[ -f dist/server/index.js ]] || fail '프로덕션 빌드가 없습니다. --skip-build 옵션을 제거하고 다시 실행해 주세요.'

if ((BUILD_ONLY == 1)); then
  log '빌드가 완료되었습니다.'
  exit 0
fi

export NODE_ENV=production HOST PORT
log "서비스 시작: http://${HOST}:${PORT}/editor/"
log '종료하려면 Ctrl+C를 누르세요.'
exec node ops/start-editor.mjs
