#!/usr/bin/env sh
# Usage: generate-env-config.sh > ../public/env-config.js
# This script writes a small JS file that sets window.__ENV from environment variables.

set -eu

# Note:
# The generated defaults intentionally use empty strings for service URLs.
# This allows the deployed static app to use a relative API base (i.e. `/api/v1`) on
# the same origin. If you want the frontend to call a different host at runtime,
# set the corresponding environment variable (e.g. `VITE_USER_SERVICE_URL`) to an
# absolute URL (including protocol and optional `/api/v1`). The script will
# include that value verbatim in the generated `env-config.js`.
#
# Example outcomes:
# - Empty default -> frontend resolves requests to `/api/v1/...` on current origin
# - Absolute host `https://api.example.com` -> frontend calls `https://api.example.com/api/v1/...`
# - Absolute host already containing `/api/v1` -> frontend uses it unchanged

# Helper to print a string as JS literal safely (simple)
q() {
  printf "%s" "$1" | sed "s/'/\\\\'/g"
}

cat <<EOF
// Generated env-config.js - do not commit generated output
window.__ENV = window.__ENV || {};
window.__ENV = Object.assign({
  VITE_USER_SERVICE_URL: '$(q "${VITE_USER_SERVICE_URL:-}")',
  VITE_EMPLOYEE_SERVICE_URL: '$(q "${VITE_EMPLOYEE_SERVICE_URL:-}")',
  VITE_ATTENDANCE_SERVICE_URL: '$(q "${VITE_ATTENDANCE_SERVICE_URL:-}")',
  VITE_LEAVE_SERVICE_URL: '$(q "${VITE_LEAVE_SERVICE_URL:-}")',
  VITE_AUDIT_SERVICE_URL: '$(q "${VITE_AUDIT_SERVICE_URL:-}")',
  VITE_API_BASE_URL: '$(q "${VITE_API_BASE_URL:-}")',
}, window.__ENV);
EOF
