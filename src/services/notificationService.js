import api from "./api";

export const getNotifications = async () => {
  const { data } = await api.get("/notifications");
  return data; // { notifications, unreadCount }
};

export const markNotificationRead = async (id) => {
  const { data } = await api.put(`/notifications/${id}/read`);
  return data.notification;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.put("/notifications/read-all");
  return data;
};
