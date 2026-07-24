import { useEffect, useState } from "react";
import { Car, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api.js";
import { PageHeader } from "../components/layout/page-header.jsx";
import { Button } from "../components/ui/button.jsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu.jsx";

export function VehiclesPage() {
  const location = useLocation();
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try { setVehicles(await api("/vehicles")); }
    catch (requestError) { setError(requestError.message); }
  }

  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!window.confirm("Remove this vehicle?")) return;
    try { await api(`/vehicles/${id}`, { method: "DELETE" }); await load(); }
    catch (requestError) { setError(requestError.message); }
  }

  return (
    <>
      <PageHeader
        eyebrow="Garage"
        title="Vehicles"
        description="Manage the vehicles available when making a reservation."
        actions={<Button asChild><Link to="/vehicles/new"><Plus className="size-4" />Add vehicle</Link></Button>}
      />
      {location.state?.message && <p className="mb-6 rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-950">{location.state.message}</p>}
      {error && <p className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="hidden grid-cols-[1.4fr_1fr_80px] border-b border-neutral-200 px-6 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:border-neutral-800 md:grid">
          <span>Vehicle</span><span>License plate</span><span className="text-right">Actions</span>
        </div>
        {vehicles.map((vehicle) => (
          <article key={vehicle.id} className="grid gap-4 border-b border-neutral-200 px-5 py-5 last:border-0 dark:border-neutral-800 md:grid-cols-[1.4fr_1fr_80px] md:items-center md:px-6">
            <div className="flex items-center gap-4"><span className="grid size-10 place-items-center rounded-lg bg-neutral-100 dark:bg-neutral-900"><Car className="size-5" /></span><div><h2 className="font-medium">{vehicle.name}</h2><p className="text-xs text-neutral-500">Added {new Date(vehicle.createdAt).toLocaleDateString()}</p></div></div>
            <div><span className="text-xs text-neutral-500 md:hidden">License plate</span><p className="font-mono text-sm">{vehicle.licensePlate}</p></div>
            <div className="justify-self-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${vehicle.name}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => remove(vehicle.id)} className="text-red-600"><Trash2 className="size-4" />Remove</DropdownMenuItem></DropdownMenuContent>
              </DropdownMenu>
            </div>
          </article>
        ))}
        {!vehicles.length && <div className="p-16 text-center"><Car className="mx-auto size-8 text-neutral-300" /><h2 className="mt-4 font-medium">No vehicles yet</h2><p className="mt-1 text-sm text-neutral-500">Add your first vehicle to start reserving.</p><Button asChild className="mt-5"><Link to="/vehicles/new">Add vehicle</Link></Button></div>}
      </section>
    </>
  );
}
