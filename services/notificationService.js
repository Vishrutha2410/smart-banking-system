import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendEmail } from "./emailService.js";

export const notify = async (
  userId,
  title,
  message,
  type = "general"
) => {
  // Create the normal in-app notification
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
  });

  // Find the user's registered email
  try {
    const user = await User.findById(userId).select(
      "name email"
    );

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: `SmartBank - ${title}`,
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
            <h2 style="color: #0f766e;">
              SmartBank
            </h2>

            <p>Hello ${user.name || "Customer"},</p>

            <h3>${title}</h3>

            <p>
              ${message}
            </p>

            <hr />

            <p style="color: #666; font-size: 13px;">
              This is an automated notification from SmartBank.
              Please do not reply to this email.
            </p>
          </div>
        `,
      });

      console.log(
        `[Email] Notification sent to ${user.email}`
      );
    } else {
      console.log(
        `[Email] No email address found for user ${userId}`
      );
    }
  } catch (emailError) {
    // Email failure should NOT break the banking operation
    console.error(
      "[Email] Failed to send notification:",
      emailError.message
    );
  }

  return notification;
};