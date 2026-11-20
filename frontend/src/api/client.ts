type ApiError = {
  error?: string | { message?: string };
  message?: string;
};

export async function api<T = unknown>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: method === 'GET' ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();

  if (!response.ok) {
    const error = payload as ApiError;
    const message = typeof error.error === 'string' ? error.error : error.error?.message;
    throw new Error(message || error.message || 'Unable to complete that request.');
  }

  return payload as T;
}
