import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

const resend = resendApiKey
  ? new Resend(resendApiKey)
  : null;

const fromEmail =
  process.env.EMAIL_FROM ||
  "SmartBank <onboarding@resend.dev>";

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}) => {
  if (!resend) {
    console.log(
      "[Email] Resend is not configured."
    );

    return {
      skipped: true,
    };
  }

  if (!to) {
    console.log(
      "[Email] No recipient email address provided."
    );

    return {
      skipped: true,
    };
  }

  try {
    const { data, error } =
      await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        text,
        html,
      });

    if (error) {
      console.error(
        "[Email] Resend error:",
        error
      );

      return {
        success: false,
        error,
      };
    }

    console.log(
      `[Email] Email sent successfully to ${to}`
    );

    console.log(
      `[Email] Resend message ID: ${data?.id || "N/A"}`
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(
      "[Email] Failed to send email:",
      error.message
    );

    return {
      success: false,
      error,
    };
  }
};