import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, CircleParking, Moon, Sun } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../context/auth-context.jsx";
import { Button } from "../components/ui/button.jsx";
import { Field, inputClass } from "../components/ui/field.jsx";

const emptyForm = {
  email: "",
  username: "",
  password: "",
  firstName: "",
  lastName: ""
};

export function AuthPage() {
  const { user, setUser, theme, setTheme } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/parking" replace />;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "register") {
        await api("/auth/register", { method: "POST", body: JSON.stringify(form) });
      }
      const session = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password })
      });
      setUser(session.user);
      navigate("/parking");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-white dark:bg-neutral-950 lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-neutral-950 p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-lg font-semibold"><span className="grid size-9 place-items-center rounded-full bg-white text-sm text-neutral-950">P</span>Parkwise</div>
        <div className="relative z-10 max-w-2xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Parking, simplified</p>
          <h1 className="text-7xl font-semibold leading-[.95] tracking-[-0.06em] xl:text-8xl">A better way<br />to park.</h1>
          <p className="mt-8 max-w-lg text-lg leading-8 text-neutral-400">Reserve your space, manage your vehicles, and keep every invoice in one calm, focused place.</p>
        </div>
        <div className="flex gap-6 text-xs text-neutral-500"><span>Secure sessions</span><span>Clear pricing</span><span>Fast checkout</span></div>
        <CircleParking className="absolute -bottom-24 -right-24 size-[34rem] stroke-[.3] text-neutral-800" />
      </section>

      <section className="relative grid place-items-center px-5 py-16 sm:px-10">
        <button
          type="button"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="absolute right-6 top-6 grid size-10 place-items-center rounded-full border border-neutral-200 dark:border-neutral-800"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
        <form className="w-full max-w-md" onSubmit={submit}>
          <div className="mb-8 lg:hidden"><div className="flex items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-full bg-neutral-950 text-xs text-white dark:bg-white dark:text-neutral-950">P</span>Parkwise</div></div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">{mode === "login" ? "Welcome back" : "Get started"}</p>
          <h2 className="text-4xl font-semibold tracking-[-0.04em]">{mode === "login" ? "Sign in to Parkwise" : "Create your account"}</h2>
          <p className="mb-8 mt-3 text-sm text-neutral-500">{mode === "login" ? "Access your vehicles and reservations." : "Start reserving parking in a few minutes."}</p>

          <div className="grid gap-5">
            {mode === "register" && (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="First name"><input className={inputClass} required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></Field>
                  <Field label="Last name"><input className={inputClass} required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></Field>
                </div>
                <Field label="Username"><input className={inputClass} required minLength="3" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></Field>
              </>
            )}
            <Field label="Email"><input className={inputClass} required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
            <Field label="Password" hint={mode === "register" ? "Use at least 10 characters." : null}><input className={inputClass} required type="password" minLength={mode === "register" ? 10 : 1} autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></Field>
          </div>

          {error && <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300" role="alert">{error}</p>}
          <Button className="mt-6 w-full" size="lg" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}<ArrowRight className="size-4" /></Button>
          <button className="mt-5 w-full text-center text-sm font-medium text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "New here? Create an account" : "Already registered? Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
