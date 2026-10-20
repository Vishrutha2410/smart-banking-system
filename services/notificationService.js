import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendEmail } from "./emailService.js";

export const notify = async (
  userId,
  title,
  message,
  type = "general"
) => {
  // ======================================================
  // EXISTING IN-APP NOTIFICATION
  // ======================================================
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
  });

  // ======================================================
  // EMAIL NOTIFICATION
  // ======================================================
  // Email failure must NOT break the banking operation.
  // The in-app notification is already created above.
  // ======================================================
  try {
    const user = await User.findById(userId).select(
      "email name"
    );

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: `Smart Banking - ${title}`,
        text: `Hello ${user.name || "Customer"},

${message}

You can log in to your Smart Banking account to view more details.

Smart Banking System
`,
      });

      console.log(
        `[Email] Notification sent successfully to ${user.email}`
      );
    } else {
      console.log(
        `[Email] No email address found for user ${userId}`
      );
    }
  } catch (emailError) {
    console.error(
      `[Email] Failed to send notification:`,
      emailError.message
    );
  }

  return notification;
};