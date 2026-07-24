import { useEffect, useState } from "react";
import { ArrowRight, MapPin, ParkingCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { PageHeader } from "../components/layout/page-header.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";

export function ParkingPage() {
  const [spaces, setSpaces] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/spaces").then(setSpaces).catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Parking"
        title="Find your space"
        description="Browse active parking spaces, compare rates, and start a focused reservation flow."
        actions={<Button asChild><Link to="/reservations/new">New reservation<ArrowRight className="size-4" /></Link></Button>}
      />
      {error && <p className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {spaces.map((space) => (
          <article key={space.id} className="group rounded-xl border border-neutral-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600">
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-lg bg-neutral-100 dark:bg-neutral-900"><ParkingCircle className="size-5" /></span>
              <Badge>{space.type}</Badge>
            </div>
            <h2 className="mt-8 text-xl font-semibold">{space.buildingName}</h2>
            <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-neutral-500"><MapPin className="mt-1 size-4 shrink-0" />{space.address}</p>
            <div className="mt-7 flex items-end justify-between border-t border-neutral-200 pt-5 dark:border-neutral-800">
              <div><span className="text-2xl font-semibold">R{Number(space.hourlyPrice).toFixed(2)}</span><span className="text-sm text-neutral-500"> / hour</span></div>
              <span className="text-sm font-medium">{space.code}</span>
            </div>
          </article>
        ))}
        {!spaces.length && !error && <div className="col-span-full rounded-xl border border-dashed border-neutral-300 p-16 text-center text-sm text-neutral-500 dark:border-neutral-700">No active parking spaces are available.</div>}
      </div>
    </>
  );
}
