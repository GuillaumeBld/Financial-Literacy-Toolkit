import { cache } from "react";

export interface IdentityProfile {
  id: string;
  email: string;
  name?: string;
  role?: string;
  accessToken?: string;
}

async function fetchRemoteProfile(token: string): Promise<IdentityProfile | null> {
  const endpoint = process.env.LMS_SSO_PROFILE_ENDPOINT;
  if (!endpoint) {
    return null;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ token })
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as Partial<IdentityProfile>;
  if (!payload.id || !payload.email) {
    return null;
  }

  return {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    accessToken: payload.accessToken ?? token
  };
}

function decodeLocalToken(token: string): IdentityProfile | null {
  try {
    const base64Payload = token.includes(".") ? token.split(".")[1] : token;
    const decoded = Buffer.from(base64Payload, "base64").toString("utf8");
    const payload = JSON.parse(decoded) as Partial<IdentityProfile>;
    if (!payload.id || !payload.email) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      accessToken: payload.accessToken ?? token
    };
  } catch (error) {
    console.warn("Unable to decode identity token", error);
    return null;
  }
}

export const verifyIdentityToken = cache(async (token: string): Promise<IdentityProfile | null> => {
  if (!token) {
    return null;
  }

  const remoteProfile = await fetchRemoteProfile(token);
  if (remoteProfile) {
    return remoteProfile;
  }

  return decodeLocalToken(token);
});
