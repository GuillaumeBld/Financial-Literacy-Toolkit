import { headers } from "next/headers";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth.config";
import { ApiError, buildHeaders, parseJsonSafely, resolveApiRequest } from "@/lib/api/shared";

type ApiClientOptions = RequestInit & {
  returnRawResponse?: boolean;
};

export async function serverFetch<T>(input: RequestInfo | URL, init?: ApiClientOptions): Promise<T> {
  const session = await getServerSession(authOptions);
  const constructedHeaders = buildHeaders(init);

  if (session?.accessToken && !constructedHeaders.has("Authorization")) {
    constructedHeaders.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const forwardedHeaders = headers();
  const referer = forwardedHeaders.get("referer");
  if (referer) {
    constructedHeaders.set("X-Client-Referer", referer);
  }

  const resolvedInput = resolveApiRequest(input);

  const response = await fetch(resolvedInput, {
    ...init,
    headers: constructedHeaders,
    credentials: "include",
    cache: init?.cache ?? "no-store"
  });

  if (init?.returnRawResponse) {
    return response as unknown as T;
  }

  if (response.status === 403) {
    const payload = await parseJsonSafely(response);
    throw new ApiError(
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: string }).message)
        : "Access to this resource is restricted to approved educators.",
      403,
      payload
    );
  }

  if (!response.ok) {
    const payload = await parseJsonSafely(response);
    throw new ApiError("Request failed", response.status, payload);
  }

  return (await response.json()) as T;
}
