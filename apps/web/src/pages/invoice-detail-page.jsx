import { ArrowDownToLine, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import { Breadcrumbs } from "../components/layout/breadcrumbs.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { downloadInvoicePdf } from "../lib/invoice-pdf.js";

export function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api(`/invoices/${id}`)
      .then(setInvoice)
      .catch((requestError) => setError(requestError.message));
  }, [id]);

  async function download() {
    try {
      setDownloading(true);
      setError("");
      await downloadInvoicePdf(invoice);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setDownloading(false);
    }
  }

  if (error) return <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (!invoice) return <p className="text-sm text-neutral-500">Loading invoice…</p>;

  return (
    <>
      <Breadcrumbs items={[{ label: "Invoices", to: "/invoices" }, { label: invoice.invoiceNumber }]} />
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <Link to="/invoices" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950 dark:hover:text-white"><ArrowLeft className="size-4" />Back to invoices</Link>
        <Button onClick={download} disabled={downloading}><ArrowDownToLine className="size-4" />{downloading ? "Preparing PDF…" : "Download PDF"}</Button>
      </div>

      <article data-invoice-document className="mx-auto max-w-5xl rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950 sm:p-10 lg:p-14">
        <header className="flex flex-col justify-between gap-8 border-b-2 border-neutral-950 pb-8 dark:border-white sm:flex-row">
          <div className="flex items-center gap-3 text-lg font-semibold"><span className="grid size-9 place-items-center rounded-full bg-neutral-950 text-xs text-white dark:bg-white dark:text-neutral-950">P</span>Parkwise</div>
          <div className="sm:text-right"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Invoice</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{invoice.invoiceNumber}</h1><p className="mt-2 text-sm text-neutral-500">Issued {new Date(invoice.issuedAt).toLocaleDateString()}</p></div>
        </header>

        <div className="mt-8 flex flex-col justify-between gap-6 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3"><CheckCircle2 className="size-5 text-blue-600" /><div><p className="text-xs text-neutral-500">Status</p><Badge variant="paid" className="mt-1">Paid</Badge></div></div>
          <div className="sm:text-right"><p className="text-xs text-neutral-500">Total paid</p><p className="mt-1 text-3xl font-semibold">{invoice.currency} {Number(invoice.total).toFixed(2)}</p></div>
        </div>

        <div className="grid gap-8 border-b border-neutral-200 py-9 dark:border-neutral-800 sm:grid-cols-2">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Customer</p><h2 className="mt-3 font-semibold">{invoice.customerName}</h2><p className="mt-1 text-sm text-neutral-500">{invoice.customerEmail}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Reservation</p><h2 className="mt-3 font-semibold">{invoice.buildingName} · {invoice.spaceCode}</h2><p className="mt-1 text-sm text-neutral-500">RES-{invoice.reservationId}</p><p className="mt-1 text-sm text-neutral-500">{invoice.vehicleName} · {invoice.licensePlate}</p></div>
        </div>

        <div className="py-9">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-5 border-b border-neutral-200 pb-3 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:border-neutral-800"><span>Description</span><span>Amount</span></div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-5 border-b border-neutral-200 py-5 dark:border-neutral-800"><div><p className="font-medium">Parking reservation</p><p className="mt-1 text-sm text-neutral-500">{new Date(invoice.startsAt).toLocaleString()} → {new Date(invoice.endsAt).toLocaleString()}</p></div><strong>{invoice.currency} {Number(invoice.subtotal).toFixed(2)}</strong></div>
          <dl className="ml-auto mt-6 grid max-w-sm gap-3 text-sm">
            <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd>{invoice.currency} {Number(invoice.subtotal).toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-500">Tax ({(Number(invoice.taxRate) * 100).toFixed(0)}%)</dt><dd>{invoice.currency} {Number(invoice.taxAmount).toFixed(2)}</dd></div>
            <div className="flex justify-between border-t-2 border-neutral-950 pt-4 text-lg font-semibold dark:border-white"><dt>Total paid</dt><dd>{invoice.currency} {Number(invoice.total).toFixed(2)}</dd></div>
          </dl>
        </div>
        <p className="mt-6 text-center text-xs text-neutral-500">Payment received through the Parkwise mock payment gateway.</p>
      </article>
    </>
  );
}
