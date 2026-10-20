import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendEmail } from "./emailService.js";

export const notify = async (
  userId,
  title,
  message,
  type = "general"
) => {
  /*
   * ============================================================
   * CREATE IN-APP NOTIFICATION
   * ============================================================
   */

  const notification =
    await Notification.create({
      user: userId,
      title,
      message,
      type,
    });

  /*
   * ============================================================
   * SEND EMAIL NOTIFICATION
   * ============================================================
   *
   * The user's registered email address is used.
   *
   * Example:
   *
   * User registers with:
   * user@gmail.com
   *
   * Notification:
   * Loan approved
   *
   * Email goes to:
   * user@gmail.com
   */

  try {
    const user =
      await User.findById(userId).select(
        "name email"
      );

    if (!user) {
      console.log(
        `[Email] User not found for notification: ${userId}`
      );

      return notification;
    }

    if (!user.email) {
      console.log(
        `[Email] No email address found for user: ${userId}`
      );

      return notification;
    }

    /*
     * ========================================================
     * EMAIL HTML
     * ========================================================
     */

    const safeName =
      user.name || "Customer";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${title}</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 0;
            background-color: #f4f7fb;
            font-family: Arial, Helvetica, sans-serif;
          "
        >
          <div
            style="
              max-width: 600px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              border: 1px solid #e5e7eb;
            "
          >

            <!-- Header -->
            <div
              style="
                background: #0f172a;
                padding: 24px;
                text-align: center;
              "
            >
              <h1
                style="
                  margin: 0;
                  color: #ffffff;
                  font-size: 24px;
                "
              >
                SmartBank
              </h1>

              <p
                style="
                  margin: 8px 0 0;
                  color: #cbd5e1;
                  font-size: 14px;
                "
              >
                Personal Banking
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 30px;">

              <p
                style="
                  margin-top: 0;
                  color: #111827;
                  font-size: 16px;
                "
              >
                Hello ${safeName},
              </p>

              <h2
                style="
                  color: #111827;
                  font-size: 20px;
                  margin-bottom: 12px;
                "
              >
                ${title}
              </h2>

              <p
                style="
                  color: #4b5563;
                  font-size: 15px;
                  line-height: 1.7;
                "
              >
                ${message}
              </p>

              <div
                style="
                  margin-top: 25px;
                  padding: 15px;
                  background: #f0fdfa;
                  border-left: 4px solid #0f766e;
                  border-radius: 6px;
                "
              >
                <p
                  style="
                    margin: 0;
                    color: #115e59;
                    font-size: 14px;
                  "
                >
                  This notification was generated from
                  your SmartBank account activity.
                </p>
              </div>

            </div>

            <!-- Footer -->
            <div
              style="
                padding: 20px 30px;
                background: #f8fafc;
                border-top: 1px solid #e5e7eb;
              "
            >
              <p
                style="
                  margin: 0;
                  color: #6b7280;
                  font-size: 12px;
                  line-height: 1.6;
                "
              >
                This is an automated email from SmartBank.
                Please do not reply to this email.
              </p>
            </div>

          </div>
        </body>
      </html>
    `;

    /*
     * ========================================================
     * SEND EMAIL
     * ========================================================
     */

    const emailResult =
      await sendEmail({
        to: user.email,
        subject: `SmartBank - ${title}`,
        text: `${title}\n\n${message}`,
        html: emailHtml,
      });

    if (emailResult?.success) {
      console.log(
        `[Email] Notification sent to ${user.email}`
      );
    }
  } catch (emailError) {
    /*
     * IMPORTANT:
     *
     * Email failure should NEVER stop the banking
     * operation.
     *
     * The in-app notification has already been created.
     */

    console.error(
      "[Email] Notification email failed:",
      emailError.message
    );
  }

  return notification;
};