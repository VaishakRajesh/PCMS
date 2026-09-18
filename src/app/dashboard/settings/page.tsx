import { redirect } from "next/navigation";
import { findUser } from "@/lib/json-db";
import { verifySession } from "@/lib/session";
import { changeCredentials } from "../actions";

// SETTINGS: change the owner login. Current password is always required
// first; the dashboard warning banner clears once the default is gone.
const input =
  "w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await verifySession();
  if (!session) redirect("/login");
  const user = findUser(session.username);
  if (!user) redirect("/login");
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Settings</h1>
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
      )}
      <form
        action={changeCredentials}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 className="font-bold">Change login</h2>
        <p className="mt-1 text-sm text-gray-500">
          Currently signed in as <b className="font-mono">{user.username}</b>.
        </p>
        <div className="mt-3 grid max-w-md gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Current password</span>
            <input name="current_password" type="password" required autoComplete="current-password" className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">New username</span>
            <input name="new_username" required defaultValue={user.username} minLength={3} className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">New password (min 6 chars)</span>
            <input name="new_password" type="password" required minLength={6} autoComplete="new-password" className={input} />
          </label>
        </div>
        <button className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          Update login
        </button>
      </form>
    </div>
  );
}
