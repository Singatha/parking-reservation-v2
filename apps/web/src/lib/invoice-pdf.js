function money(invoice, value) {
  return `${invoice.currency} ${Number(value).toFixed(2)}`;
}

function date(value) {
  return new Date(value).toLocaleDateString();
}

function dateTime(value) {
  return new Date(value).toLocaleString();
}

export async function downloadInvoicePdf(invoice) {
  const { jsPDF } = await import("jspdf");
  const document = new jsPDF({ unit: "mm", format: "a4" });
  const left = 20;
  const right = 190;
  let y = 22;

  document.setProperties({
    title: invoice.invoiceNumber,
    subject: `Parking reservation invoice ${invoice.invoiceNumber}`,
    author: "Parkwise"
  });

  document.setFillColor(10, 10, 10);
  document.circle(25, y, 5, "F");
  document.setTextColor(255, 255, 255);
  document.setFontSize(9);
  document.setFont("helvetica", "bold");
  document.text("P", 25, y + 1.2, { align: "center" });
  document.setTextColor(10, 10, 10);
  document.setFontSize(16);
  document.text("Parkwise", 34, y + 1.8);

  document.setFontSize(9);
  document.setTextColor(100, 100, 100);
  document.text("INVOICE", right, y - 2, { align: "right" });
  document.setFontSize(17);
  document.setTextColor(10, 10, 10);
  document.text(invoice.invoiceNumber, right, y + 5, { align: "right" });
  document.setFont("helvetica", "normal");
  document.setFontSize(9);
  document.setTextColor(100, 100, 100);
  document.text(`Issued ${date(invoice.issuedAt)}`, right, y + 10, { align: "right" });

  y = 42;
  document.setDrawColor(10, 10, 10);
  document.setLineWidth(0.7);
  document.line(left, y, right, y);

  y = 54;
  document.setFont("helvetica", "bold");
  document.setFontSize(10);
  document.setTextColor(10, 10, 10);
  document.text("PAID", left, y);
  document.setFontSize(18);
  document.text(money(invoice, invoice.total), right, y, { align: "right" });
  document.setFont("helvetica", "normal");

  y = 73;
  document.setFontSize(8);
  document.setTextColor(100, 100, 100);
  document.text("CUSTOMER", left, y);
  document.text("RESERVATION", 110, y);
  document.setFontSize(10);
  document.setTextColor(10, 10, 10);
  document.setFont("helvetica", "bold");
  document.text(invoice.customerName, left, y + 7);
  document.text(`${invoice.buildingName} - ${invoice.spaceCode}`, 110, y + 7);
  document.setFont("helvetica", "normal");
  document.setTextColor(80, 80, 80);
  document.text(invoice.customerEmail, left, y + 13);
  document.text(`RES-${invoice.reservationId}`, 110, y + 13);
  document.text(`${invoice.vehicleName} - ${invoice.licensePlate}`, 110, y + 19);

  y = 108;
  document.setDrawColor(220, 220, 220);
  document.setLineWidth(0.2);
  document.line(left, y, right, y);
  document.setFontSize(8);
  document.setTextColor(100, 100, 100);
  document.text("DESCRIPTION", left, y + 7);
  document.text("AMOUNT", right, y + 7, { align: "right" });
  document.line(left, y + 11, right, y + 11);

  document.setFontSize(10);
  document.setFont("helvetica", "bold");
  document.setTextColor(10, 10, 10);
  document.text("Parking reservation", left, y + 20);
  document.text(money(invoice, invoice.subtotal), right, y + 20, { align: "right" });
  document.setFont("helvetica", "normal");
  document.setFontSize(8);
  document.setTextColor(100, 100, 100);
  document.text(
    `${dateTime(invoice.startsAt)} - ${dateTime(invoice.endsAt)}`,
    left,
    y + 26
  );
  document.line(left, y + 32, right, y + 32);

  y = 153;
  const labelX = 135;
  document.setFontSize(9);
  document.setTextColor(80, 80, 80);
  document.text("Subtotal", labelX, y);
  document.text(money(invoice, invoice.subtotal), right, y, { align: "right" });
  document.text(`Tax (${(Number(invoice.taxRate) * 100).toFixed(0)}%)`, labelX, y + 8);
  document.text(money(invoice, invoice.taxAmount), right, y + 8, { align: "right" });
  document.setDrawColor(10, 10, 10);
  document.setLineWidth(0.5);
  document.line(labelX, y + 13, right, y + 13);
  document.setFont("helvetica", "bold");
  document.setFontSize(11);
  document.setTextColor(10, 10, 10);
  document.text("Total paid", labelX, y + 21);
  document.text(money(invoice, invoice.total), right, y + 21, { align: "right" });

  document.setFont("helvetica", "normal");
  document.setFontSize(8);
  document.setTextColor(120, 120, 120);
  document.text(
    "Payment received through the Parkwise mock payment gateway.",
    105,
    282,
    { align: "center" }
  );

  document.save(`${invoice.invoiceNumber}.pdf`);
}
