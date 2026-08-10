const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${apiBaseUrl}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error("Login failed");
  return response.json();
}

export async function signup(name: string, email: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${apiBaseUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password }),
  });
  if (!response.ok) throw new Error("Signup failed");
  return response.json();
}

export async function logout(): Promise<void> {
  await fetch(`${apiBaseUrl}/api/auth/sign-out`, {
    method: "POST",
    credentials: "include",
  });
}

export async function getSession(): Promise<AuthSession | null> {
  const response = await fetch(`${apiBaseUrl}/api/auth/get-session`, {
    credentials: "include",
  });
  if (!response.ok) return null;
  const data = await response.json();
  if (!data?.user) return null;
  return data;
}
