import { prisma } from "./prisma";

export type NotificationType = 'BOOKING' | 'PAYMENT' | 'MEMBERSHIP' | 'SYSTEM';

export async function createNotification({
  userId,
  title,
  message,
  type,
}: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function getUserNotifications(userId: string) {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

export async function markNotificationAsRead(id: string) {
  return await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

