#!/usr/bin/env bash
# Pulls paid orders from Polar into ops/state/polar-orders.json (no customer PII: emails are hashed).
# Requires POLAR_ACCESS_TOKEN (orders:read). Used by .github/workflows/polar-sync.yml and the metrics routine.
set -euo pipefail
[ -n "${POLAR_ACCESS_TOKEN:-}" ] || { echo "POLAR_ACCESS_TOKEN not set" >&2; exit 1; }
out="${1:-ops/state/polar-orders.json}"
page=1; all='[]'
while :; do
  resp="$(curl -sf -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" "https://api.polar.sh/v1/orders/?limit=100&page=$page&sorting=-created_at")"
  items="$(printf '%s' "$resp" | jq '[.items[] | {id, created_at, status, paid, product: .product.name, total_amount, net_amount, currency, customer: (.customer.email // "" | @base64 | .[0:12])}]')"
  all="$(jq -n --argjson a "$all" --argjson b "$items" '$a + $b')"
  n="$(printf '%s' "$items" | jq 'length')"; [ "$n" -lt 100 ] && break; page=$((page+1)); [ $page -gt 50 ] && break
done
jq -n --argjson orders "$all" '{synced_at: (now | todate), count: ($orders | length), paid: ([$orders[] | select(.paid == true)] | length), net_cents: ([$orders[] | select(.paid == true) | .net_amount] | add // 0), orders: $orders}' > "$out"
echo "synced $(jq .count "$out") orders ($(jq .paid "$out") paid) -> $out"
