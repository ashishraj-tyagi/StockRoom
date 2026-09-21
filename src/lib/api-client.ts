import { handleBrowserApi } from "./browser-api";

export const isStaticHost = process.env.NEXT_PUBLIC_STATIC === "true";

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  if (isStaticHost) {
    return handleBrowserApi(path, init);
  }
  return fetch(path, init);
}
