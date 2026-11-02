import { createBrowserSupabaseClient } from "./config";

export const authErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login") || normalized.includes("invalid credentials")) return "That email or password was not accepted.";
  if (normalized.includes("already registered") || normalized.includes("user already registered")) return "An account with that email already exists. Try logging in.";
  if (normalized.includes("email not confirmed")) return "Please verify your email before logging in.";
  if (normalized.includes("rate limit")) return "Too many attempts. Please wait a moment and try again.";
  return "We couldn’t complete that account request. Please try again.";
};

export async function signOut() {
  const client = createBrowserSupabaseClient();
  if (!client) return { error: new Error("Supabase is not configured.") };
  return client.auth.signOut();
}
