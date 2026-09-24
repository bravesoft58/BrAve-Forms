// BF-56: shared by the scan route, the portal page and the admin QR modal.
// No server imports here, so client components can read the session length.

/** Hours an inspector session lasts after a QR scan (Andy, 2026-09-23). */
export const INSPECTOR_SESSION_HOURS = 12;

export const INSPECTOR_SESSION_COOKIE = "inspector_session";

/** The cookie is only ever sent to the portal, never to /dashboard or /api. */
export const INSPECTOR_COOKIE_PATH = "/inspector";
