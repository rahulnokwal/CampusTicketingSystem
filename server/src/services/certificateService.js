import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export const generateParticipationCertificate = async ({
  studentName,
  eventTitle,
  eventDate,
  eventVenue,
  clubName,
  ticketCode,
  verificationUrl,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        layout: "landscape",
        size: "A4",
        margin: 40,
      });

      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const width = doc.page.width;
      const height = doc.page.height;

      doc
        .lineWidth(4)
        .strokeColor("#4CA1E2")
        .rect(20, 20, width - 40, height - 40)
        .stroke();

      doc
        .lineWidth(1)
        .strokeColor("#EB6C4A")
        .rect(26, 26, width - 52, height - 52)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .fillColor("#4CA1E2")
        .text("CAMPUS LIFE EVENT PLATFORM", 0, 55, { align: "center" });

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#6B7280")
        .text("OFFICIAL VERIFIABLE CERTIFICATE OF PARTICIPATION", 0, 75, {
          align: "center",
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(32)
        .fillColor("#1F2937")
        .text("CERTIFICATE OF PARTICIPATION", 0, 115, { align: "center" });

      doc
        .font("Helvetica")
        .fontSize(14)
        .fillColor("#4B5563")
        .text("This is proudly presented to", 0, 165, { align: "center" });

      doc
        .font("Helvetica-Bold")
        .fontSize(28)
        .fillColor("#3B8FCE")
        .text(studentName.toUpperCase(), 0, 195, { align: "center" });

      doc
        .lineWidth(1.5)
        .strokeColor("#3B8FCE")
        .moveTo(width / 2 - 150, 230)
        .lineTo(width / 2 + 150, 230)
        .stroke();

      const formattedDate = new Date(eventDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      const bodyText = `For actively attending and successfully participating in "${eventTitle}", organized by ${clubName} on ${formattedDate} at ${eventVenue}.`;

      doc
        .font("Helvetica")
        .fontSize(13)
        .fillColor("#374151")
        .text(bodyText, width / 2 - 240, 255, {
          width: 480,
          align: "center",
          lineGap: 6,
        });

      const qrDataUrl = await QRCode.toDataURL(
        verificationUrl || `https://campuslife.edu/verify?ticket=${ticketCode}`,
        { margin: 1, width: 100 },
      );
      const qrImageBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
      doc.image(qrImageBuffer, 50, height - 145, { width: 80, height: 80 });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#9CA3AF")
        .text(`Pass ID: ${ticketCode}`, 50, height - 60, {
          width: 90,
          align: "center",
        })
        .text("Scan to verify credential", 50, height - 50, {
          width: 90,
          align: "center",
        });

      const sigY = height - 105;

      doc
        .lineWidth(1)
        .strokeColor("#9CA3AF")
        .moveTo(width / 2 - 120, sigY)
        .lineTo(width / 2 - 10, sigY)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#1F2937")
        .text("Club Lead / Coordinator", width / 2 - 120, sigY + 5, {
          width: 110,
          align: "center",
        });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#6B7280")
        .text(clubName, width / 2 - 120, sigY + 18, {
          width: 110,
          align: "center",
        });

      doc
        .lineWidth(1)
        .strokeColor("#9CA3AF")
        .moveTo(width - 190, sigY)
        .lineTo(width - 80, sigY)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#1F2937")
        .text("Campus Life Director", width - 190, sigY + 5, {
          width: 110,
          align: "center",
        });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#6B7280")
        .text("Office of Student Affairs", width - 190, sigY + 18, {
          width: 110,
          align: "center",
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
