import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { NOTIFICATION_DAYS } from '../config/constants';

/**
 * Calculate if a notification should be created based on the event date and notification day offset
 */
const shouldCreateNotification = (eventDate: Date, daysAhead: number): boolean => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(eventDate);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Only create notification if event is exactly daysAhead days away or more
  return diffDays >= daysAhead;
};

/**
 * Create notifications for a calendar event (H-7, H-3, H-1)
 * This function determines which notifications need to be created based on the event date
 */
export const createEventNotifications = async (
  calendarEventId: string,
  userId: string,
  eventTitle: string,
  eventDate: Date
): Promise<void> => {
  try {
    const notifications = [];
    
    // Check and create H-7 notification
    if (shouldCreateNotification(eventDate, NOTIFICATION_DAYS.SEVEN_DAYS)) {
      notifications.push({
        title: `Pengingat: 7 hari lagi - ${eventTitle}`,
        message: `Kegiatan "${eventTitle}" akan berlangsung dalam 7 hari (${eventDate.toLocaleDateString('id-ID')})`,
        type: 'WARNING' as const,
        userId,
        calendarEventId,
      });
    }
    
    // Check and create H-3 notification
    if (shouldCreateNotification(eventDate, NOTIFICATION_DAYS.THREE_DAYS)) {
      notifications.push({
        title: `Pengingat: 3 hari lagi - ${eventTitle}`,
        message: `Kegiatan "${eventTitle}" akan berlangsung dalam 3 hari (${eventDate.toLocaleDateString('id-ID')})`,
        type: 'WARNING' as const,
        userId,
        calendarEventId,
      });
    }
    
    // Check and create H-1 notification
    if (shouldCreateNotification(eventDate, NOTIFICATION_DAYS.ONE_DAY)) {
      notifications.push({
        title: `Pengingat: Besok - ${eventTitle}`,
        message: `Kegiatan "${eventTitle}" akan berlangsung besok (${eventDate.toLocaleDateString('id-ID')})`,
        type: 'WARNING' as const,
        userId,
        calendarEventId,
      });
    }
    
    // Create all notifications in batch
    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
      logger.info(`Created ${notifications.length} notifications for event: ${eventTitle}`);
    }
  } catch (error) {
    logger.error(`Error creating event notifications for event "${eventTitle}" (date: ${eventDate.toISOString()}):`, error);
    throw error;
  }
};

/**
 * Delete all notifications associated with a calendar event
 */
export const deleteEventNotifications = async (calendarEventId: string): Promise<void> => {
  try {
    await prisma.notification.deleteMany({
      where: { calendarEventId },
    });
    logger.info(`Deleted notifications for calendar event: ${calendarEventId}`);
  } catch (error) {
    logger.error('Error deleting event notifications:', error);
    throw error;
  }
};

/**
 * Update notifications for a calendar event
 * This will delete old notifications and create new ones
 */
export const updateEventNotifications = async (
  calendarEventId: string,
  userId: string,
  eventTitle: string,
  eventDate: Date
): Promise<void> => {
  try {
    // Delete old notifications
    await deleteEventNotifications(calendarEventId);
    
    // Reset notification flags on calendar event
    await prisma.calendarEvent.update({
      where: { id: calendarEventId },
      data: {
        notified7Days: false,
        notified3Days: false,
        notified1Day: false,
      },
    });
    
    // Create new notifications
    await createEventNotifications(calendarEventId, userId, eventTitle, eventDate);
    
    logger.info(`Updated notifications for event: ${eventTitle}`);
  } catch (error) {
    logger.error('Error updating event notifications:', error);
    throw error;
  }
};

export default {
  createEventNotifications,
  deleteEventNotifications,
  updateEventNotifications,
};
