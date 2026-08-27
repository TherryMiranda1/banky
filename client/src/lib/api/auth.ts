import { apiFetch } from "./client.js";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Aspsp {
  name: string;
  country: string;
  logo?: string;
  bic?: string;
  psuTypes?: string[];
}

export interface GetAspspsResponse {
  aspsps: Aspsp[];
}

export interface StartAuthResponse {
  url: string;
}

export interface CompleteAuthParams {
  code?: string;
  state: string;
  error?: string;
  error_description?: string;
}

export interface CompleteAuthResponse {
  success: boolean;
  connectionId?: string;
  accountsCount?: number;
}

export async function registerUser(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password })
  });
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function getMe(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>("/auth/me", {
    method: "GET"
  });
}

export async function getAspsps(country = "ES"): Promise<Aspsp[]> {
  const query = country ? `?country=${encodeURIComponent(country)}` : "";
  const data = await apiFetch<GetAspspsResponse>(`/aspsps${query}`);
  return data.aspsps;
}

export async function startAuth(aspspName: string, aspspCountry: string): Promise<StartAuthResponse> {
  return apiFetch<StartAuthResponse>("/auth/start", {
    method: "POST",
    body: JSON.stringify({
      aspspName,
      aspspCountry
    })
  });
}

export async function completeAuthCallback(params: CompleteAuthParams): Promise<CompleteAuthResponse> {
  return apiFetch<CompleteAuthResponse>("/auth/callback", {
    method: "POST",
    body: JSON.stringify(params)
  });
}
