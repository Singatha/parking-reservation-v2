import { useEffect, useState } from "react";
import { CalendarDays, CreditCard, Plus, ReceiptText, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api.js";
import { PageHeader } from "../components/layout/page-header.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";

function statusVariant(status) {
  if (status === "confirmed") return "paid";
  if (status === "pending_payment") return "pending";
  return "cancelled";
}

export function ReservationsPage() {
  const location = useLocation();
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState(location.state?.message ?? "");
  const [error, setError] = useState("");

  async function load() {
    try { setReservations(await api("/reservations")); }
    catch (requestError) { setError(requestError.message); }
  }

  useEffect(() => { load(); }, []);

  async function pay(reservation, outcome) {
    try {
      const payment = await api("/payments/mock", {
        method: "POST",
        body: JSON.stringify({
          reservationId: reservation.id,
          outcome,
          idempotencyKey: crypto.randomUUID()
        })
      });
      if (payment.status === "failed") setError(payment.failureReason);
      else setMessage("Mock payment approved. Your invoice is ready.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      await load();
    }
  }

  async function cancel(id) {
    try {
      await api(`/reservations/${id}/cancel`, { method: "POST" });
      setMessage("Reservation cancelled.");
      await load();
    } catch (requestError) { setError(requestError.message); }
  }

  return (
    <>
      <PageHeader
        eyebrow="Bookings"
        title="Reservations"
        description="Track upcoming bookings, complete payment holds, and review past reservations."
        actions={<Button asChild><Link to="/reservations/new"><Plus className="size-4" />New reservation</Link></Button>}
      />
      {message && <p className="mb-6 flex items-center justify-between rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-950">{message}<button aria-label="Dismiss message" onClick={() => setMessage("")}><X className="size-4" /></button></p>}
      {error && <p className="mb-6 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{error}<button aria-label="Dismiss error" onClick={() => setError("")}><X className="size-4" /></button></p>}

      <section className="grid gap-4">
        {reservations.map((reservation) => (
          <article key={reservation.id} className="grid gap-5 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 md:grid-cols-[70px_minmax(0,1fr)_auto] md:items-center md:p-6">
            <div className="grid size-16 place-items-center rounded-lg border border-neutral-200 text-center dark:border-neutral-800">
              <CalendarDays className="size-4 text-neutral-400" />
              <div className="-mt-2"><strong className="block text-lg leading-none">{new Date(reservation.startsAt).getDate()}</strong><span className="text-[10px] uppercase text-neutral-500">{new Date(reservation.startsAt).toLocaleString("en", { month: "short" })}</span></div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{reservation.buildingName} · {reservation.spaceCode}</h2><Badge variant={statusVariant(reservation.status)}>{reservation.status.replace("_", " ")}</Badge></div>
              <p className="mt-2 text-sm text-neutral-500">{new Date(reservation.startsAt).toLocaleString()} → {new Date(reservation.endsAt).toLocaleString()}</p>
              <p className="mt-1 text-sm text-neutral-500">{reservation.vehicleName} · {reservation.licensePlate}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:max-w-64 md:justify-end">
              <strong className="mr-2">R{Number(reservation.totalPrice).toFixed(2)}</strong>
              {reservation.status === "pending_payment" && (
                <>
                  <Button size="sm" onClick={() => pay(reservation, "approved")}><CreditCard className="size-3.5" />Pay now</Button>
                  <Button size="sm" variant="outline" onClick={() => pay(reservation, "declined")}>Simulate decline</Button>
                </>
              )}
              {["pending_payment", "confirmed"].includes(reservation.status) && <Button size="sm" variant="ghost" onClick={() => cancel(reservation.id)}>Cancel</Button>}
              {reservation.status === "confirmed" && <Button size="sm" variant="outline" asChild><Link to="/invoices"><ReceiptText className="size-3.5" />Invoice</Link></Button>}
            </div>
          </article>
        ))}
        {!reservations.length && <div className="rounded-xl border border-dashed border-neutral-300 p-16 text-center dark:border-neutral-700"><ReceiptText className="mx-auto size-8 text-neutral-300" /><h2 className="mt-4 font-medium">No reservations yet</h2><p className="mt-1 text-sm text-neutral-500">Start by choosing a parking space and time.</p><Button asChild className="mt-5"><Link to="/reservations/new">New reservation</Link></Button></div>}
      </section>
    </>
  );
}
