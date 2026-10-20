import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendEmail } from "./emailService.js";

export const notify = async (
  userId,
  title,
  message,
  type = "general"
) => {
  // Keep the existing in-app notification logic
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
  });

  // Send email notification separately
  try {
    const user = await User.findById(userId).select("email name");

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: `Smart Banking - ${title}`,
        text: `Hello ${user.name || "Customer"},\n\n${message}\n\nSmart Banking System`,
      });

      console.log(
        `[Email] Notification sent to ${user.email}`
      );
    } else {
      console.log(
        `[Email] No email found for user ${userId}`
      );
    }
  } catch (emailError) {
    // Email failure must NOT cancel the banking notification
    console.error(
      "[Email] Failed to send notification:",
      emailError.message
    );
  }

  return notification;
};