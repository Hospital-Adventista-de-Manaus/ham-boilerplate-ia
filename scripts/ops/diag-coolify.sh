#!/usr/bin/env bash
# diag-coolify.sh — Diagnostica reinicializações recorrentes do Coolify.
#
# O que faz: por uma janela de tempo (default 10min), monitora os containers
# `coolify*` em três frentes em paralelo:
#   1. docker events    — captura die/start/oom/kill em tempo real
#   2. probes HTTP      — curl em localhost:80 (proxy) e localhost:8000 (server)
#   3. polling de estado — detecta mudança de RestartCount/StartedAt e, ao
#                         detectar, salva os últimos 120 lines do log do
#                         container que reiniciou + snapshot de stats.
# Ao final, produz summary.txt com veredito provisório (proxy vs server vs sistêmico).
#
# Uso:  ./diag-coolify.sh [duracao_em_segundos]   # default 600 (10 min)
#
# Saída: ~/coolify-diag-YYYYMMDD-HHMMSS/

set -u

DURATION="${1:-600}"

TARGETS=$(docker ps -a --format '{{.Names}}' | grep -E '^coolify($|-)' | sort -u)
if [ -z "$TARGETS" ]; then
  echo "ERRO: nenhum container começando com 'coolify' encontrado." >&2
  echo "Containers existentes:" >&2
  docker ps -a --format '  {{.Names}} ({{.Status}})' >&2
  exit 1
fi

OUT_DIR="${HOME}/coolify-diag-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT_DIR"

EVENTS_LOG="$OUT_DIR/events.log"
PROBES_LOG="$OUT_DIR/probes.log"
STATS_LOG="$OUT_DIR/stats.log"
DOCKER_EVENTS_LOG="$OUT_DIR/docker-events.log"
SUMMARY="$OUT_DIR/summary.txt"

ts() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(ts)] $*"; }

log "================================================="
log "Diagnóstico Coolify — coletando por ${DURATION}s"
log "Output: $OUT_DIR"
log "================================================="
log "Targets monitorados:"
echo "$TARGETS" | sed 's/^/  - /'

{
  echo "=== ESTADO INICIAL ($(ts)) ==="
  echo
  for c in $TARGETS; do
    docker inspect --format '{{.Name}}: status={{.State.Status}} restarts={{.RestartCount}} exit={{.State.ExitCode}} oom={{.State.OOMKilled}} started={{.State.StartedAt}}' "$c"
  done
  echo
  echo "Disco /:    $(df -h / | awk 'NR==2 {print $4" livre de "$2" ("$5" usado)"}')"
  echo "Memória:    $(free -h | awk '/^Mem:/ {print $7" livre de "$2}')"
  echo "Load avg:   $(uptime | grep -oE 'load average:.*')"
} > "$OUT_DIR/initial-state.txt"

# Background 1: docker events em tempo real
docker events \
  --filter 'event=die' \
  --filter 'event=start' \
  --filter 'event=oom' \
  --filter 'event=restart' \
  --filter 'event=kill' \
  --filter 'event=stop' \
  --format '[{{.Time}}] {{.Action}} name={{.Actor.Attributes.name}} exit={{.Actor.Attributes.exitCode}}' \
  > "$DOCKER_EVENTS_LOG" 2>&1 &
EVENTS_PID=$!

# Background 2: probes HTTP a cada 10s
(
  END=$(($(date +%s) + DURATION))
  while [ "$(date +%s)" -lt "$END" ]; do
    NOW=$(ts)
    P80=$(curl -sS --max-time 5 -o /dev/null -w '%{http_code} %{time_total}s' http://localhost:80/ 2>/dev/null || echo "ERR -")
    P8K=$(curl -sS --max-time 5 -o /dev/null -w '%{http_code} %{time_total}s' http://localhost:8000/ 2>/dev/null || echo "ERR -")
    echo "[$NOW] proxy80=[$P80]  main8000=[$P8K]"
    sleep 10
  done
) > "$PROBES_LOG" 2>&1 &
PROBE_PID=$!

# Background 3: docker stats a cada 30s
(
  END=$(($(date +%s) + DURATION))
  while [ "$(date +%s)" -lt "$END" ]; do
    echo "--- $(ts) ---"
    docker stats --no-stream --format 'table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.CPUPerc}}' $TARGETS 2>/dev/null
    echo
    sleep 30
  done
) > "$STATS_LOG" 2>&1 &
STATS_PID=$!

cleanup() {
  kill "$EVENTS_PID" "$PROBE_PID" "$STATS_PID" 2>/dev/null
  wait 2>/dev/null
}
trap cleanup EXIT INT TERM

declare -A LAST_RC LAST_SAT
for c in $TARGETS; do
  LAST_RC[$c]=$(docker inspect --format '{{.RestartCount}}' "$c" 2>/dev/null || echo 0)
  LAST_SAT[$c]=$(docker inspect --format '{{.State.StartedAt}}' "$c" 2>/dev/null || echo unknown)
done

START=$(date +%s)
END=$((START + DURATION))
log "Coleta vai até $(date -d "@$END" '+%H:%M:%S')"
log "(Acompanhar em outra sessão: tail -f $EVENTS_LOG)"

while [ "$(date +%s)" -lt "$END" ]; do
  for c in $TARGETS; do
    RC=$(docker inspect --format '{{.RestartCount}}' "$c" 2>/dev/null || echo NA)
    ST=$(docker inspect --format '{{.State.Status}}' "$c" 2>/dev/null || echo NA)
    SAT=$(docker inspect --format '{{.State.StartedAt}}' "$c" 2>/dev/null || echo NA)
    EXIT=$(docker inspect --format '{{.State.ExitCode}}' "$c" 2>/dev/null || echo NA)
    OOM=$(docker inspect --format '{{.State.OOMKilled}}' "$c" 2>/dev/null || echo NA)

    prev_rc=${LAST_RC[$c]:-0}
    prev_sat=${LAST_SAT[$c]:-unknown}

    if [ "$RC" != "$prev_rc" ] || [ "$SAT" != "$prev_sat" ]; then
      log "*** RESTART: $c (status=$ST restarts=$prev_rc->$RC exit=$EXIT oom=$OOM)"
      {
        echo
        echo "==========================================================="
        echo "[$(ts)] RESTART DETECTADO: $c"
        echo "  status=$ST  restarts=$prev_rc->$RC  exit=$EXIT  oom=$OOM"
        echo "  startedAt=$SAT"
        echo "==========================================================="
        echo ">>> Últimas 120 linhas de log de $c:"
        docker logs --tail=120 --timestamps "$c" 2>&1
        echo "<<< fim log $c"
        echo
        echo ">>> Stats no instante:"
        docker stats --no-stream --format 'table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.CPUPerc}}' $TARGETS 2>/dev/null
        echo
      } >> "$EVENTS_LOG"
    fi

    LAST_RC[$c]=$RC
    LAST_SAT[$c]=$SAT
  done
  sleep 5
done

{
  echo "================================================================"
  echo "SUMÁRIO — Diagnóstico Coolify"
  echo "Período: $(date -d "@$START" '+%H:%M:%S') -> $(date -d "@$END" '+%H:%M:%S') (${DURATION}s)"
  echo "================================================================"
  echo
  echo "--- Estado FINAL dos containers ---"
  for c in $TARGETS; do
    docker inspect --format '  {{.Name}}: status={{.State.Status}} restarts={{.RestartCount}} exit={{.State.ExitCode}} oom={{.State.OOMKilled}}' "$c"
  done
  echo
  echo "--- Contagem de eventos do Docker daemon ---"
  if [ -s "$DOCKER_EVENTS_LOG" ]; then
    awk '
      {
        if (match($0, /name=[^ ]+/)) {
          name = substr($0, RSTART+5, RLENGTH-5);
          if ($0 ~ / die /)     die[name]++;
          if ($0 ~ / start /)   start[name]++;
          if ($0 ~ / oom /)     oom[name]++;
          if ($0 ~ / kill /)    kill[name]++;
          if ($0 ~ / restart /) restart[name]++;
          seen[name]=1;
        }
      }
      END {
        for (n in seen) {
          printf "  %s: die=%d start=%d oom=%d kill=%d restart=%d\n", n, die[n]+0, start[n]+0, oom[n]+0, kill[n]+0, restart[n]+0;
        }
      }' "$DOCKER_EVENTS_LOG" | sort
  else
    echo "  (nenhum evento die/start/oom/kill no período — containers estáveis)"
  fi
  echo
  echo "--- Probes HTTP ---"
  if [ -s "$PROBES_LOG" ]; then
    TOTAL=$(wc -l < "$PROBES_LOG")
    F80=$(grep -cE 'proxy80=\[(ERR|[045][0-9][0-9])' "$PROBES_LOG" || true)
    F8K=$(grep -cE 'main8000=\[(ERR|[045][0-9][0-9])' "$PROBES_LOG" || true)
    echo "  Total probes:           $TOTAL"
    echo "  Falhas proxy:80:        ${F80:-0}"
    echo "  Falhas main:8000:       ${F8K:-0}"
    if [ "${F80:-0}" -gt 0 ] || [ "${F8K:-0}" -gt 0 ]; then
      echo
      echo "  Primeiras 10 falhas:"
      grep -E '(proxy80|main8000)=\[(ERR|[045][0-9][0-9])' "$PROBES_LOG" | head -10 | sed 's/^/    /'
    fi
  fi
  echo
  echo "--- Veredito provisório ---"
  HAS_OOM=$(grep -c 'oom=true' "$EVENTS_LOG" 2>/dev/null || echo 0)
  if [ "${HAS_OOM:-0}" -gt 0 ]; then
    echo "  [!] OOMKilled detectado — RAM insuficiente em algum container."
  fi
  RESTARTS=$(grep -c 'RESTART DETECTADO' "$EVENTS_LOG" 2>/dev/null || echo 0)
  if [ "${RESTARTS:-0}" -eq 0 ]; then
    echo "  Nenhum restart capturado no período. Aumente DURATION ou rode em outro horário."
  else
    echo "  ${RESTARTS} restart(s) detectado(s):"
    grep 'RESTART DETECTADO' "$EVENTS_LOG" | awk -F'RESTART DETECTADO:' '{print $2}' | awk '{print $1}' | sort | uniq -c | sort -rn | sed 's/^/    /'
  fi
  echo
  if [ "${F80:-0}" -gt 0 ] && [ "${F8K:-0}" -eq 0 ]; then
    echo "  -> Proxy falhou nos probes; main respondeu. SUSPEITO: coolify-proxy."
  elif [ "${F8K:-0}" -gt 0 ] && [ "${F80:-0}" -eq 0 ]; then
    echo "  -> Main falhou nos probes; proxy respondeu. SUSPEITO: coolify (server)."
  elif [ "${F80:-0}" -gt 0 ] && [ "${F8K:-0}" -gt 0 ]; then
    echo "  -> Ambos falharam — problema sistêmico (rede/disco/OOM/db)."
  fi
  echo
  echo "================================================================"
  echo "Arquivos gerados em $OUT_DIR:"
  ls -la "$OUT_DIR" | tail -n +2 | sed 's/^/  /'
  echo
  echo "Para investigar logs dos restarts em detalhe:  cat $EVENTS_LOG"
} | tee "$SUMMARY"
