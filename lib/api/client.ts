"use client";

import { getSession } from "next-auth/react";

import { ApiError, buildHeaders, parseJsonSafely, resolveApiRequest } from "@/lib/api/shared";

type ApiClientOptions = RequestInit & {
  returnRawResponse?: boolean;
};

export async function apiFetch<T>(input: RequestInfo | URL, init?: ApiClientOptions): Promise<T> {
  const session = await getSession();
  const headers = buildHeaders(init);

  if (session?.accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const resolvedInput = resolveApiRequest(input);

  const response = await fetch(resolvedInput, {
    ...init,
    headers,
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
        : "You do not have permission to perform that action.",
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
