import { config } from "../config.js";

export const SESSION_COOKIE = "parking_session";
export const CSRF_COOKIE = "parking_csrf";

export function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        const key = separator === -1 ? part : part.slice(0, separator);
        const value = separator === -1 ? "" : part.slice(separator + 1);
        return [key, decodeURIComponent(value)];
      })
  );
}

const sharedOptions = {
  secure: config.COOKIE_SECURE,
  sameSite: "strict",
  path: "/"
};

export function setSessionCookies(res, session) {
  const maxAge = config.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  res.cookie(SESSION_COOKIE, session.token, {
    ...sharedOptions,
    httpOnly: true,
    maxAge
  });
  res.cookie(CSRF_COOKIE, session.csrfToken, {
    ...sharedOptions,
    httpOnly: false,
    maxAge
  });
}

export function clearSessionCookies(res) {
  res.clearCookie(SESSION_COOKIE, { ...sharedOptions, httpOnly: true });
  res.clearCookie(CSRF_COOKIE, { ...sharedOptions, httpOnly: false });
}
