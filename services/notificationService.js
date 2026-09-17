import Notification from "../models/Notification.js";

export const notify = async (userId, title, message, type = "general") => {
  return Notification.create({ user: userId, title, message, type });
};
