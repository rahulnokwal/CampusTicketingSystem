import nodemailer from "nodemailer";
import Mailgen from "mailgen";

const mailGenerator = new Mailgen({
  theme: "salted",
  product: {
    name: "Campus Life",
    link: process.env.CLIENT_URL || "http://localhost:5173",
    logo: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=100&auto=format&fit=crop&q=80",
  },
});

let transporter = null;

const createTransporter = async () => {
  if (transporter) return transporter;

  if (
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_USER !== "test@ethereal.email"
  ) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(
        `[Mail Service] Ethereal test mailer initialized: ${testAccount.user}`,
      );
    } catch (err) {
      console.warn("[Mail Service] Ethereal creation fallback:", err.message);

      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }
  return transporter;
};

export const sendWelcomeEmail = async ({ to, name, role }) => {
  try {
    const client = await createTransporter();
    const emailContent = {
      body: {
        name,
        intro: `Welcome to Campus Life! Your account has been registered as a ${role.replace("_", " ").toUpperCase()}.`,
        action: {
          instructions:
            "Discover upcoming hackathons, cultural fests, and workshops on campus:",
          button: {
            color: "#6366f1",
            text: "Explore Campus Events",
            link: `${process.env.CLIENT_URL || "http://localhost:5173"}/events`,
          },
        },
        outro:
          "Need help? Reply to this email or reach out to our campus events team.",
      },
    };

    const emailHtml = mailGenerator.generate(emailContent);
    const emailText = mailGenerator.generatePlaintext(emailContent);

    const info = await client.sendMail({
      from: process.env.SMTP_FROM || '"Campus Life" <tickets@campuslife.edu>',
      to,
      subject: "Welcome to Campus Life — College Event Platform",
      text: emailText,
      html: emailHtml,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Mail Service] Welcome email preview: ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(
      `[Mail Service Error] Welcome email failed: ${error.message}`,
    );
    return { success: false, error: error.message };
  }
};

export const sendTicketConfirmationEmail = async ({
  to,
  name,
  eventTitle,
  eventDate,
  eventVenue,
  ticketCode,
  qrDataUrl,
}) => {
  try {
    const client = await createTransporter();
    const formattedDate = new Date(eventDate).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const emailContent = {
      body: {
        name,
        intro: `Your registration for "${eventTitle}" is confirmed! Here is your official admission pass.`,
        table: {
          data: [
            { Item: "Event", Details: eventTitle },
            { Item: "Date & Time", Details: formattedDate },
            { Item: "Venue", Details: eventVenue },
            { Item: "Ticket ID", Details: ticketCode },
          ],
          columns: {
            customWidth: {
              Item: "30%",
              Details: "70%",
            },
          },
        },
        action: {
          instructions:
            "Present the QR code below at the campus entrance for seamless volunteer check-in:",
          button: {
            color: "#10b981",
            text: "View My Ticket in App",
            link: `${process.env.CLIENT_URL || "http://localhost:5173"}/my-tickets`,
          },
        },
        outro:
          "Please arrive 15 minutes before the event begins. Screenshots or printed passes are accepted.",
      },
    };

    const emailHtml = mailGenerator.generate(emailContent);
    const emailText = mailGenerator.generatePlaintext(emailContent);

    const attachments = [];
    if (qrDataUrl && qrDataUrl.startsWith("data:image/png;base64,")) {
      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
      attachments.push({
        filename: `ticket-${ticketCode}.png`,
        content: Buffer.from(base64Data, "base64"),
        cid: "ticket-qr-code",
      });
    }

    const info = await client.sendMail({
      from:
        process.env.SMTP_FROM ||
        '"Campus Life Tickets" <tickets@campuslife.edu>',
      to,
      subject: `[TICKET CONFIRMED] ${eventTitle} — Pass #${ticketCode}`,
      text: emailText,
      html: qrDataUrl
        ? emailHtml.replace(
            "<!--[if mso]>",
            `<div style="text-align: center; margin: 25px 0;"><img src="cid:ticket-qr-code" alt="QR Pass" style="width:200px; height:200px; border-radius:12px; border: 2px solid #6366f1;"/></div><!--[if mso]>`,
          )
        : emailHtml,
      attachments,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Mail Service] Ticket email preview: ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(`[Mail Service Error] Ticket email failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};
