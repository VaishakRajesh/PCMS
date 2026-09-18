"use server";

import { redirect } from "next/navigation";
import { findUser } from "@/lib/json-db";
import { verifyPassword } from "@/lib/passwords";
import { createSession, destroySession } from "@/lib/session";

// Runs on the server when the login form is submitted.
// Returns { error } on failure (shown under the form); on success it
// creates the session cookie and sends the owner to THEIR portfolio.
export async function loginAction(
  _prev: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const user = username ? findUser(username) : null;
  const ok = user && (await verifyPassword(password, user.passwordHash));
  if (!user || !ok) {
    return { error: "Invalid username or password." };
  }
  await createSession({ username: user.username, slug: user.slug });
  redirect("/dashboard"); // land in the CMS, not the public page
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
