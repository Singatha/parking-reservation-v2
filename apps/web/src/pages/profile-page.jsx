import { KeyRound, UserRound } from "lucide-react";
import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../context/auth-context.jsx";
import { PageHeader } from "../components/layout/page-header.jsx";
import { Button } from "../components/ui/button.jsx";
import { Field, inputClass } from "../components/ui/field.jsx";

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function updateProfile(event) {
    event.preventDefault();
    setError("");
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const result = await api("/profile", { method: "PUT", body: JSON.stringify(values) });
      setUser(result.user);
      setMessage("Profile updated.");
    } catch (requestError) { setError(requestError.message); }
  }

  async function changePassword(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    try {
      await api("/profile/password", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      form.reset();
      setMessage("Password changed. Other sessions were signed out.");
    } catch (requestError) { setError(requestError.message); }
  }

  return (
    <>
      <PageHeader eyebrow="Account" title="Profile" description="Manage your personal information and account security." />
      {message && <p className="mb-6 rounded-md border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-950">{message}</p>}
      {error && <p className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
      <div className="grid gap-7 lg:grid-cols-2">
        <form onSubmit={updateProfile} className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950 sm:p-8">
          <span className="grid size-11 place-items-center rounded-lg bg-neutral-100 dark:bg-neutral-900"><UserRound className="size-5" /></span>
          <h2 className="mt-6 text-xl font-semibold">Personal information</h2>
          <p className="mt-1 text-sm text-neutral-500">Update how your name appears across Parkwise.</p>
          <div className="mt-7 grid gap-5">
            <Field label="Email" hint="Email changes are not currently supported."><input className={inputClass} value={user.email} disabled /></Field>
            <Field label="Username"><input className={inputClass} name="username" defaultValue={user.username} required minLength="3" /></Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First name"><input className={inputClass} name="firstName" defaultValue={user.firstName} required /></Field>
              <Field label="Last name"><input className={inputClass} name="lastName" defaultValue={user.lastName} required /></Field>
            </div>
            <Field label="Role"><input className={inputClass} value={user.role} disabled /></Field>
          </div>
          <div className="mt-7 flex justify-end border-t border-neutral-200 pt-6 dark:border-neutral-800"><Button>Save profile</Button></div>
        </form>

        <form onSubmit={changePassword} className="h-fit rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950 sm:p-8">
          <span className="grid size-11 place-items-center rounded-lg bg-neutral-100 dark:bg-neutral-900"><KeyRound className="size-5" /></span>
          <h2 className="mt-6 text-xl font-semibold">Change password</h2>
          <p className="mt-1 text-sm text-neutral-500">Other active sessions will be signed out.</p>
          <div className="mt-7 grid gap-5">
            <Field label="Current password"><input className={inputClass} name="currentPassword" type="password" autoComplete="current-password" required /></Field>
            <Field label="New password" hint="Use at least 10 characters."><input className={inputClass} name="newPassword" type="password" autoComplete="new-password" minLength="10" required /></Field>
          </div>
          <div className="mt-7 flex justify-end border-t border-neutral-200 pt-6 dark:border-neutral-800"><Button>Change password</Button></div>
        </form>
      </div>
    </>
  );
}
