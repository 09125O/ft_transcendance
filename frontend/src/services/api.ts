export type ApiError = {
  code: string;
  message: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: ApiError | null;
};

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  let json: ApiResponse<T> | undefined;
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch {
    // Some failing responses may not include JSON, so fall back to the status code.
  }

  if (!response.ok) {
    throw new Error(json?.error?.message ?? `Request failed (${response.status})`);
  }

  if (!json || !json.success || json.data === null) {
    throw new Error("Invalid server response");
  }

  return json.data;
}
