const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

function getCookie(name) {
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

export async function api(path, options = {}) {
  const method = options.method ?? "GET";
  const csrfToken = getCookie("parking_csrf");
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(!["GET", "HEAD", "OPTIONS"].includes(method) && csrfToken
        ? { "X-CSRF-Token": decodeURIComponent(csrfToken) }
        : {}),
      ...options.headers
    }
  });

  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? "Request failed");
  return body.data;
}
