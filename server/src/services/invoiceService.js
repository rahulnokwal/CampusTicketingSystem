import PDFDocument from "pdfkit";

export const generateTaxInvoicePDF = async ({
  invoiceNumber,
  paymentDate,
  studentName,
  studentEmail,
  eventTitle,
  eventDate,
  eventVenue,
  clubName,
  seatLabel,
  ticketCode,
  amount,
  gatewayPaymentId,
  gatewayOrderId,
}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      const width = doc.page.width;

      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor("#4CA1E2")
        .text("CAMPUS LIFE", 40, 45);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#6B7280")
        .text("Official Event Ticketing & Registration Platform", 40, 70);

      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .fillColor("#1F2937")
        .text("TAX INVOICE / RECEIPT", width - 240, 45, {
          align: "right",
          width: 200,
        });

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#4B5563")
        .text(`Invoice No: ${invoiceNumber}`, width - 240, 68, {
          align: "right",
          width: 200,
        })
        .text(
          `Date: ${new Date(paymentDate).toLocaleDateString()}`,
          width - 240,
          82,
          { align: "right", width: 200 },
        )
        .text(`Status: COMPLETED (PAID)`, width - 240, 96, {
          align: "right",
          width: 200,
        });

      doc
        .lineWidth(1)
        .strokeColor("#E5E7EB")
        .moveTo(40, 120)
        .lineTo(width - 40, 120)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#1F2937")
        .text("BILLED TO (ATTENDEE):", 40, 140);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#374151")
        .text(`Name: ${studentName}`, 40, 158)
        .text(`Email: ${studentEmail}`, 40, 172)
        .text(`Pass Reference: ${ticketCode}`, 40, 186);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#1F2937")
        .text("ORGANIZER DETAILS:", width / 2 + 20, 140);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#374151")
        .text(`Club: ${clubName}`, width / 2 + 20, 158)
        .text(`Venue: ${eventVenue}`, width / 2 + 20, 172)
        .text(
          `Event Date: ${new Date(eventDate).toLocaleDateString()}`,
          width / 2 + 20,
          186,
        );

      const tableTop = 230;
      doc.rect(40, tableTop, width - 80, 26).fill("#F3F4F6");

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#374151")
        .text("ITEM DESCRIPTION", 50, tableTop + 8)
        .text("SEAT ALLOCATION", 300, tableTop + 8)
        .text("QTY", 420, tableTop + 8)
        .text("AMOUNT (INR)", width - 130, tableTop + 8, {
          width: 80,
          align: "right",
        });

      const rowTop = tableTop + 34;
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#1F2937")
        .text(`Admission Ticket — ${eventTitle}`, 50, rowTop)
        .text(
          seatLabel ? `Seat ${seatLabel}` : "General Admission",
          300,
          rowTop,
        )
        .text("1", 420, rowTop)
        .text(`₹${amount.toFixed(2)}`, width - 130, rowTop, {
          width: 80,
          align: "right",
        });

      doc
        .lineWidth(1)
        .strokeColor("#E5E7EB")
        .moveTo(40, rowTop + 24)
        .lineTo(width - 40, rowTop + 24)
        .stroke();

      const subtotalTop = rowTop + 36;
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#4B5563")
        .text("Subtotal:", width - 240, subtotalTop)
        .text(`₹${amount.toFixed(2)}`, width - 130, subtotalTop, {
          width: 80,
          align: "right",
        });

      doc
        .text("Platform Processing Fee:", width - 240, subtotalTop + 16)
        .text("₹0.00", width - 130, subtotalTop + 16, {
          width: 80,
          align: "right",
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#1F2937")
        .text("Total Amount Paid:", width - 240, subtotalTop + 36)
        .text(`₹${amount.toFixed(2)}`, width - 130, subtotalTop + 36, {
          width: 80,
          align: "right",
        });

      const payBoxTop = subtotalTop + 80;
      doc
        .rect(40, payBoxTop, width - 80, 50)
        .fillAndStroke("#F9FAFB", "#E5E7EB");

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#1F2937")
        .text("TRANSACTION VERIFICATION", 50, payBoxTop + 10);

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#6B7280")
        .text(
          `Gateway Payment ID: ${gatewayPaymentId || "N/A"}`,
          50,
          payBoxTop + 24,
        )
        .text(
          `Gateway Order ID: ${gatewayOrderId || "N/A"}`,
          50,
          payBoxTop + 35,
        )
        .text(
          "Payment Gateway: Razorpay Encrypted Channel",
          width / 2,
          payBoxTop + 24,
        );

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#9CA3AF")
        .text(
          "This is a computer-generated tax invoice and receipt issued by Campus Life Ticketing Platform. No signature required.",
          40,
          doc.page.height - 50,
          { align: "center", width: width - 80 },
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
