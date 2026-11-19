import type { View } from "./network-model";
export const prefix = "conferences/uist-demo/";
export const isStatic = () =>
  typeof document !== "undefined" &&
  !!document.querySelector('meta[name="pages-demo"]');
export async function callApi<T>(
  path: string,
  viewer: string,
  method = "GET",
  body?: unknown,
): Promise<{ status: number; data: T }> {
  if (isStatic()) {
    const { pagesRequest } = await import("./pages-api");
    return pagesRequest(path, method, viewer, body);
  }
  const res = await fetch("/api/demo/" + path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", "X-Demo-Persona": viewer },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}
export async function loadView(viewer: string) {
  const r = await callApi<View & { error?: string }>(prefix + "state", viewer);
  if (r.status !== 200)
    throw new Error(r.data.error || "Could not load the demo.");
  return r.data;
}
export function downloadJson(name: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
