// Runtime environment config for the frontend.
// This file will be loaded before the app bundle and may be overwritten
// at deploy time to inject environment-specific values without rebuilding.
//
// Important:
// - Defaults are intentionally empty so that the frontend will use a relative
//   API base on the same origin (i.e. requests will target `/<api-version>/...`,
//   resulting in `https://your-domain.com/api/v1/...`).
// - If you need the frontend to call a different host at runtime, set the
//   corresponding environment variable (e.g. `VITE_USER_SERVICE_URL`) to an
//   absolute host (with or without `/api/v1`). The `apiBase` helper will
//   correctly append `/api/v1` if needed and will avoid double-appending if the
//   value already contains a versioned path.

window.__ENV = window.__ENV || {};

window.__ENV = Object.assign(
  {
    // Leave defaults empty so the deployed app will use a relative base.
    VITE_USER_SERVICE_URL: "",
    VITE_EMPLOYEE_SERVICE_URL: "",
    VITE_ATTENDANCE_SERVICE_URL: "",
    VITE_LEAVE_SERVICE_URL: "",
    VITE_AUDIT_SERVICE_URL: "",
    VITE_API_BASE_URL: "",
  },
  window.__ENV,
);

// Note: these are host-only values (no trailing `/api/v1`).
// `src/lib/api/apiBase.ts` will append `/api/v1` when constructing the full base.
