import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { ArrowDownToLine, ChevronLeft, ChevronRight, Eye, FileText, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { PageHeader } from "../components/layout/page-header.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { inputClass } from "../components/ui/field.jsx";
import { downloadInvoicePdf } from "../lib/invoice-pdf.js";

export function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api("/invoices").then(setInvoices).catch((requestError) => setError(requestError.message));
  }, []);

  async function download(id) {
    try {
      setError("");
      const invoice = await api(`/invoices/${id}`);
      await downloadInvoicePdf(invoice);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const columns = useMemo(() => [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice",
      cell: ({ row }) => <span className="font-medium">{row.original.invoiceNumber}</span>
    },
    {
      accessorKey: "issuedAt",
      header: "Date",
      cell: ({ row }) => new Date(row.original.issuedAt).toLocaleDateString()
    },
    {
      accessorKey: "reservationId",
      header: "Reservation",
      cell: ({ row }) => <span className="font-mono text-xs">RES-{row.original.reservationId}</span>
    },
    {
      accessorKey: "total",
      header: "Amount",
      cell: ({ row }) => <span className="font-medium">{row.original.currency} {Number(row.original.total).toFixed(2)}</span>
    },
    {
      id: "status",
      header: "Status",
      cell: () => <Badge variant="paid">Paid</Badge>
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/invoices/${row.original.id}`)}><Eye className="size-3.5" />View</Button>
          <Button variant="ghost" size="sm" onClick={() => download(row.original.id)}><ArrowDownToLine className="size-3.5" />Download</Button>
        </div>
      )
    }
  ], [navigate]);

  const table = useReactTable({
    data: invoices,
    columns,
    state: { globalFilter: search },
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  });

  return (
    <>
      <PageHeader eyebrow="Billing" title="Invoices" description="View, search, and download invoices generated after successful mock payments." />
      {error && <p className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="inline-flex w-fit rounded-md border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-950">
          <button className="rounded px-5 py-2 text-sm font-medium bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">All</button>
          <button className="rounded px-5 py-2 text-sm text-neutral-500">Paid</button>
        </div>
        <div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" /><input aria-label="Search invoices" className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoices…" /></div>
      </div>

      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50/70 text-xs uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>{headerGroup.headers.map((header) => <th key={header.id} className="px-5 py-3 font-medium">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} onDoubleClick={() => navigate(`/invoices/${row.original.id}`)} className="border-b border-neutral-200 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/40">
                  {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-5 py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-neutral-200 dark:divide-neutral-800 md:hidden">
          {table.getRowModel().rows.map((row) => (
            <div key={row.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div><p className="font-medium">{row.original.invoiceNumber}</p><p className="mt-1 text-xs text-neutral-500">{new Date(row.original.issuedAt).toLocaleDateString()} · RES-{row.original.reservationId}</p></div>
                <div className="text-right"><p className="font-medium">{row.original.currency} {Number(row.original.total).toFixed(2)}</p><Badge variant="paid" className="mt-2">Paid</Badge></div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/invoices/${row.original.id}`)}><Eye className="size-3.5" />View</Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => download(row.original.id)}><ArrowDownToLine className="size-3.5" />Download</Button>
              </div>
            </div>
          ))}
        </div>

        {!table.getRowModel().rows.length && <div className="p-16 text-center"><FileText className="mx-auto size-8 text-neutral-300" /><h2 className="mt-4 font-medium">No invoices found</h2><p className="mt-1 text-sm text-neutral-500">Invoices are created after successful payment.</p></div>}
        {invoices.length > 10 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4 text-sm dark:border-neutral-800">
            <span className="text-neutral-500">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
            <div className="flex gap-2"><Button variant="outline" size="icon" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}><ChevronLeft className="size-4" /></Button><Button variant="outline" size="icon" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}><ChevronRight className="size-4" /></Button></div>
          </div>
        )}
      </section>
    </>
  );
}
