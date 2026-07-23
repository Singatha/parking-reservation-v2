const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export async function api(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers
    }
  });

  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? "Request failed");
  return body.data;
}
