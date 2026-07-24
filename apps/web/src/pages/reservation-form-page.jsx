import { ArrowLeft, Clock3, LockKeyhole } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { Breadcrumbs } from "../components/layout/breadcrumbs.jsx";
import { Button } from "../components/ui/button.jsx";
import { Field, inputClass } from "../components/ui/field.jsx";

export function ReservationFormPage() {
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({ parkingSpaceId: "", vehicleId: "", startsAt: "", endsAt: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api("/spaces"), api("/vehicles")])
      .then(([spacesData, vehiclesData]) => { setSpaces(spacesData); setVehicles(vehiclesData); })
      .catch((requestError) => setError(requestError.message));
  }, []);

  const selectedSpace = spaces.find((space) => String(space.id) === String(form.parkingSpaceId));
  const selectedVehicle = vehicles.find((vehicle) => String(vehicle.id) === String(form.vehicleId));
  const hours = useMemo(() => {
    if (!form.startsAt || !form.endsAt) return 0;
    return Math.max(0, Math.ceil((new Date(form.endsAt) - new Date(form.startsAt)) / 3_600_000));
  }, [form.startsAt, form.endsAt]);
  const total = hours * Number(selectedSpace?.hourlyPrice ?? 0);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/reservations", { method: "POST", body: JSON.stringify(form) });
      navigate("/reservations", { state: { message: "Space held for 15 minutes. Complete the mock payment to confirm it." } });
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Reservations", to: "/reservations" }, { label: "New reservation" }]} />
      <Link to="/reservations" className="mb-5 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950 dark:hover:text-white"><ArrowLeft className="size-4" />Back to reservations</Link>
      <h1 className="text-4xl font-semibold tracking-[-0.04em]">New reservation</h1>
      <p className="mt-3 text-sm text-neutral-500">Choose your space, vehicle, and time. Payment follows on the reservations page.</p>

      <form onSubmit={submit} className="mt-9 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="grid gap-7 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950 sm:p-8">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">1. Location and vehicle</p></div>
          <Field label="Parking space">
            <select className={inputClass} value={form.parkingSpaceId} onChange={(event) => setForm({ ...form, parkingSpaceId: event.target.value })} required>
              <option value="">Select a space</option>
              {spaces.map((space) => <option key={space.id} value={space.id}>{space.code} · {space.buildingName}</option>)}
            </select>
          </Field>
          <Field label="Vehicle">
            <select className={inputClass} value={form.vehicleId} onChange={(event) => setForm({ ...form, vehicleId: event.target.value })} required>
              <option value="">Select a vehicle</option>
              {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.licensePlate}</option>)}
            </select>
          </Field>
          {!vehicles.length && <p className="text-sm text-amber-700">Add a vehicle before continuing. <Link className="underline" to="/vehicles/new">Add vehicle</Link></p>}
          <div className="mt-2 border-t border-neutral-200 pt-7 dark:border-neutral-800"><p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">2. Date and time</p></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="From"><input className={inputClass} value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} type="datetime-local" required /></Field>
            <Field label="Until"><input className={inputClass} value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} type="datetime-local" required /></Field>
          </div>
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
        </section>

        <aside className="sticky top-24 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Booking summary</p>
          <dl className="mt-6 grid gap-5 text-sm">
            <div><dt className="text-neutral-500">Vehicle</dt><dd className="mt-1 font-medium">{selectedVehicle ? `${selectedVehicle.name} · ${selectedVehicle.licensePlate}` : "Not selected"}</dd></div>
            <div><dt className="text-neutral-500">Location</dt><dd className="mt-1 font-medium">{selectedSpace ? `${selectedSpace.buildingName} · ${selectedSpace.code}` : "Not selected"}</dd></div>
            <div><dt className="text-neutral-500">Duration</dt><dd className="mt-1 flex items-center gap-2 font-medium"><Clock3 className="size-4" />{hours ? `${hours} hour${hours === 1 ? "" : "s"}` : "Choose dates"}</dd></div>
          </dl>
          <div className="mt-6 border-t border-neutral-200 pt-5 dark:border-neutral-800">
            <div className="flex justify-between text-sm text-neutral-500"><span>Rate</span><span>{selectedSpace ? `R${Number(selectedSpace.hourlyPrice).toFixed(2)} / hour` : "—"}</span></div>
            <div className="mt-4 flex justify-between text-lg font-semibold"><span>Total</span><span>R{total.toFixed(2)}</span></div>
          </div>
          <Button className="mt-6 w-full" size="lg" disabled={busy || !vehicles.length}>{busy ? "Holding space…" : "Continue to payment"}</Button>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500"><LockKeyhole className="size-3.5" />Secure 15-minute payment hold</p>
        </aside>
      </form>
    </>
  );
}
