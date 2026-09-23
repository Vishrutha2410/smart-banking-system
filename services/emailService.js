import nodemailer from "nodemailer";

const isConfigured =
  Boolean(process.env.EMAIL_USER) &&
  Boolean(process.env.EMAIL_PASSWORD);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host:
        process.env.EMAIL_HOST,
      port:
        Number(
          process.env.EMAIL_PORT ||
            587
        ),
      secure:
        Number(
          process.env.EMAIL_PORT
        ) === 465,

      auth: {
        user:
          process.env.EMAIL_USER,

        pass:
          process.env.EMAIL_PASSWORD,
      },
    })
  : null;

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}) => {
  if (!transporter) {
    console.log(
      "[Email] Email service not configured."
    );

    return {
      skipped: true,
    };
  }

  return transporter.sendMail({
    from:
      process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
};