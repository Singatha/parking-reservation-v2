import { MoreHorizontal, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { PageHeader } from "../components/layout/page-header.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu.jsx";
import { inputClass } from "../components/ui/field.jsx";

export function ManageSpacesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [spaces, setSpaces] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");

  async function load() {
    try { setSpaces(await api("/spaces?includeInactive=true")); }
    catch (requestError) { setError(requestError.message); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => spaces.filter((space) => {
    const matchesSearch = `${space.code} ${space.buildingName} ${space.address}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "all" || (status === "active" ? Boolean(space.active) : !space.active);
    return matchesSearch && matchesStatus;
  }), [spaces, search, status]);

  async function toggle(space) {
    try {
      await api(`/spaces/${space.id}/status`, { method: "PATCH", body: JSON.stringify({ active: !Boolean(space.active) }) });
      await load();
    } catch (requestError) { setError(requestError.message); }
  }

  async function remove(space) {
    if (!window.confirm(`Remove parking space ${space.code}?`)) return;
    try { await api(`/spaces/${space.id}`, { method: "DELETE" }); await load(); }
    catch (requestError) { setError(requestError.message); }
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Manage spaces"
        description="Create and maintain the parking inventory customers can reserve."
        actions={<Button asChild><Link to="/admin/spaces/new"><Plus className="size-4" />Add space</Link></Button>}
      />
      {location.state?.message && <p className="mb-6 rounded-md border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-950">{location.state.message}</p>}
      {error && <p className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
      <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" /><input aria-label="Search spaces" className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search spaces, locations, or codes" /></div>
        <select aria-label="Filter by status" className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
      </div>

      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="hidden grid-cols-[100px_minmax(180px,1fr)_120px_110px_100px_60px] border-b border-neutral-200 bg-neutral-50/70 px-5 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 lg:grid">
          <span>Space</span><span>Location</span><span>Type</span><span>Rate</span><span>Status</span><span />
        </div>
        {filtered.map((space) => (
          <article key={space.id} className="grid gap-4 border-b border-neutral-200 p-5 last:border-0 dark:border-neutral-800 lg:grid-cols-[100px_minmax(180px,1fr)_120px_110px_100px_60px] lg:items-center">
            <strong>{space.code}</strong>
            <div><h2 className="font-medium">{space.buildingName}</h2><p className="mt-1 text-xs text-neutral-500">{space.address}</p></div>
            <Badge>{space.type}</Badge>
            <span>R{Number(space.hourlyPrice).toFixed(2)}/hr</span>
            <Badge variant={space.active ? "paid" : "cancelled"}>{space.active ? "Active" : "Inactive"}</Badge>
            <div className="justify-self-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${space.code}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => navigate(`/admin/spaces/${space.id}/edit`)}><Pencil className="size-4" />Edit</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => toggle(space)}><Power className="size-4" />{space.active ? "Deactivate" : "Activate"}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => remove(space)} className="text-red-600"><Trash2 className="size-4" />Remove</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </article>
        ))}
        {!filtered.length && <div className="p-16 text-center text-sm text-neutral-500">No parking spaces match these filters.</div>}
      </section>
    </>
  );
}
