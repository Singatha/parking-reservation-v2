import { ArrowLeft, ParkingCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { Breadcrumbs } from "../components/layout/breadcrumbs.jsx";
import { Button } from "../components/ui/button.jsx";
import { Field, inputClass } from "../components/ui/field.jsx";

export function SpaceFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState({ code: "", type: "standard", buildingName: "", address: "", hourlyPrice: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api("/spaces?includeInactive=true")
      .then((spaces) => {
        const space = spaces.find((item) => String(item.id) === id);
        if (!space) throw new Error("Parking space not found");
        setForm({
          code: space.code,
          type: space.type,
          buildingName: space.buildingName,
          address: space.address,
          hourlyPrice: space.hourlyPrice
        });
      })
      .catch((requestError) => setError(requestError.message));
  }, [editing, id]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api(editing ? `/spaces/${id}` : "/spaces", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(form)
      });
      navigate("/admin/spaces", { state: { message: editing ? "Parking space updated." : "Parking space created." } });
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs items={[{ label: "Manage spaces", to: "/admin/spaces" }, { label: editing ? "Edit space" : "Add space" }]} />
      <Link to="/admin/spaces" className="mb-5 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950 dark:hover:text-white"><ArrowLeft className="size-4" />Back to spaces</Link>
      <h1 className="text-4xl font-semibold tracking-[-0.04em]">{editing ? "Edit space" : "Add space"}</h1>
      <p className="mt-3 text-sm text-neutral-500">{editing ? "Update the details customers see during booking." : "Create a new space in the parking inventory."}</p>

      <form onSubmit={submit} className="mt-9 grid gap-6 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950 sm:p-8">
        <span className="grid size-12 place-items-center rounded-lg bg-neutral-100 dark:bg-neutral-900"><ParkingCircle className="size-6" /></span>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Space code"><input className={inputClass} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="A-01" required /></Field>
          <Field label="Type"><select className={inputClass} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="standard">Standard</option><option value="accessible">Accessible</option><option value="motorcycle">Motorcycle</option><option value="ev">EV</option><option value="oversized">Oversized</option></select></Field>
        </div>
        <Field label="Building name"><input className={inputClass} value={form.buildingName} onChange={(event) => setForm({ ...form, buildingName: event.target.value })} placeholder="Central Parkade" required /></Field>
        <Field label="Address"><input className={inputClass} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="1 Main Road" required /></Field>
        <Field label="Hourly price (R)"><input className={inputClass} value={form.hourlyPrice} onChange={(event) => setForm({ ...form, hourlyPrice: event.target.value })} type="number" min="0.01" step="0.01" required /></Field>
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
        <div className="flex flex-col-reverse gap-3 border-t border-neutral-200 pt-6 dark:border-neutral-800 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate("/admin/spaces")}>Cancel</Button>
          <Button disabled={busy}>{busy ? "Saving…" : "Save parking space"}</Button>
        </div>
      </form>
    </div>
  );
}
