const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

export class ApiError extends Error {
  public readonly status: number;
  public readonly payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function parseJsonSafely(response: Response) {
  try {
    return await response.clone().json();
  } catch (error) {
    return undefined;
  }
}

export function buildHeaders(init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Content-Type") && init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

export function resolveApiRequest(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof input === "string") {
    if (ABSOLUTE_URL_PATTERN.test(input)) {
      return input;
    }

    const base =
      typeof window === "undefined"
        ? process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE
        : process.env.NEXT_PUBLIC_API_BASE;

    if (base) {
      const normalizedPath = input.startsWith("/") ? input.slice(1) : input;
      return new URL(normalizedPath, base).toString();
    }

    return input;
  }

  if (input instanceof URL) {
    return input;
  }

  return input;
}
