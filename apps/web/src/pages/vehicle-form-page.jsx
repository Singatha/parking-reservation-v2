import { ArrowLeft, CarFront } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../api.js";
import { Breadcrumbs } from "../components/layout/breadcrumbs.jsx";
import { Button } from "../components/ui/button.jsx";
import { Field, inputClass } from "../components/ui/field.jsx";

export function VehicleFormPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      await api("/vehicles", { method: "POST", body: JSON.stringify(values) });
      navigate("/vehicles", { state: { message: "Vehicle added." } });
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs items={[{ label: "Vehicles", to: "/vehicles" }, { label: "Add vehicle" }]} />
      <Link to="/vehicles" className="mb-5 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950 dark:hover:text-white"><ArrowLeft className="size-4" />Back to vehicles</Link>
      <h1 className="text-4xl font-semibold tracking-[-0.04em]">Add vehicle</h1>
      <p className="mt-3 text-sm text-neutral-500">Add the details you will recognise during checkout.</p>

      <form onSubmit={submit} className="mt-9 grid gap-6 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950 sm:p-8">
        <span className="grid size-12 place-items-center rounded-lg bg-neutral-100 dark:bg-neutral-900"><CarFront className="size-6" /></span>
        <Field label="Vehicle name" hint="For example, Blue hatchback."><input className={inputClass} name="name" placeholder="My vehicle" required /></Field>
        <Field label="License plate"><input className={inputClass} name="licensePlate" placeholder="CA 123-456" required /></Field>
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
        <div className="flex flex-col-reverse gap-3 border-t border-neutral-200 pt-6 dark:border-neutral-800 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate("/vehicles")}>Cancel</Button>
          <Button disabled={busy}>{busy ? "Saving…" : "Save vehicle"}</Button>
        </div>
      </form>
    </div>
  );
}
