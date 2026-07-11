export function json<T>(data: T, init?: ResponseInit) {
  return Response.json(data, { headers: { "Cache-Control": "no-store" }, ...init });
}

export function error(message: string, status = 400) {
  return json({ error: message }, { status });
}
