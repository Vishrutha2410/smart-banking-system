import { google } from "googleapis";

const gmailClientId = process.env.GMAIL_CLIENT_ID;
const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET;
const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN;

const gmailSender =
  process.env.GMAIL_SENDER || "vishruthakavi06@gmail.com";

const isConfigured =
  Boolean(gmailClientId) &&
  Boolean(gmailClientSecret) &&
  Boolean(gmailRefreshToken);

const createGmailClient = () => {
  if (!isConfigured) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    gmailClientId,
    gmailClientSecret
  );

  oauth2Client.setCredentials({
    refresh_token: gmailRefreshToken,
  });

  return google.gmail({
    version: "v1",
    auth: oauth2Client,
  });
};

const makeRawEmail = ({ to, subject, text, html }) => {
  const headers = [
    `From: SmartBank <${gmailSender}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
  ].join("\r\n");

  const body = html || text || "";

  const email = `${headers}\r\n\r\n${body}`;

  return Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}) => {
  if (!isConfigured) {
    console.log("[Email] Gmail API is not configured.");
    return {
      skipped: true,
    };
  }

  if (!to) {
    console.log("[Email] No recipient email address.");
    return {
      skipped: true,
    };
  }

  try {
    const gmail = createGmailClient();

    const raw = makeRawEmail({
      to,
      subject,
      text,
      html,
    });

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw,
      },
    });

    console.log(
      `[Email] Email sent successfully to ${to}`
    );

    console.log(
      `[Email] Gmail message ID: ${result.data.id}`
    );

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error(
      "[Email] Gmail API error:",
      error.response?.data || error.message
    );

    return {
      success: false,
      error,
    };
  }
};