import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { NOTIFICATION_DAYS } from '../config/constants';

// Calculate date ranges for notification checks
const getDateRange = (daysAhead: number): { start: Date; end: Date } => {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysAhead);
  
  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

// Check and create notifications for upcoming events
export const checkUpcomingEvents = async (): Promise<void> => {
  try {
    logger.info('Running cron job: checking upcoming events for notifications');

    // Check for events 7 days ahead
    const range7Days = getDateRange(NOTIFICATION_DAYS.SEVEN_DAYS);
    const events7Days = await prisma.calendarEvent.findMany({
      where: {
        date: {
          gte: range7Days.start,
          lte: range7Days.end,
        },
        notified7Days: false,
      },
      include: {
        user: true,
        incomingLetter: {
          select: {
            letterNumber: true,
            subject: true,
          },
        },
        outgoingLetter: {
          select: {
            letterNumber: true,
            subject: true,
          },
        },
      },
    });

    for (const event of events7Days) {
      await prisma.notification.create({
        data: {
          title: `Pengingat: 7 hari lagi - ${event.title}`,
          message: `Kegiatan "${event.title}" akan berlangsung dalam 7 hari (${event.date.toLocaleDateString('id-ID')})`,
          type: 'WARNING',
          userId: event.userId,
          calendarEventId: event.id,
        },
      });

      await prisma.calendarEvent.update({
        where: { id: event.id },
        data: { notified7Days: true },
      });

      logger.info(`Created 7-day notification for event: ${event.title}`);
    }

    // Check for events 3 days ahead
    const range3Days = getDateRange(NOTIFICATION_DAYS.THREE_DAYS);
    const events3Days = await prisma.calendarEvent.findMany({
      where: {
        date: {
          gte: range3Days.start,
          lte: range3Days.end,
        },
        notified3Days: false,
      },
      include: {
        user: true,
      },
    });

    for (const event of events3Days) {
      await prisma.notification.create({
        data: {
          title: `Pengingat: 3 hari lagi - ${event.title}`,
          message: `Kegiatan "${event.title}" akan berlangsung dalam 3 hari (${event.date.toLocaleDateString('id-ID')})`,
          type: 'WARNING',
          userId: event.userId,
          calendarEventId: event.id,
        },
      });

      await prisma.calendarEvent.update({
        where: { id: event.id },
        data: { notified3Days: true },
      });

      logger.info(`Created 3-day notification for event: ${event.title}`);
    }

    // Check for events 1 day ahead
    const range1Day = getDateRange(NOTIFICATION_DAYS.ONE_DAY);
    const events1Day = await prisma.calendarEvent.findMany({
      where: {
        date: {
          gte: range1Day.start,
          lte: range1Day.end,
        },
        notified1Day: false,
      },
      include: {
        user: true,
      },
    });

    for (const event of events1Day) {
      await prisma.notification.create({
        data: {
          title: `Pengingat: Besok - ${event.title}`,
          message: `Kegiatan "${event.title}" akan berlangsung besok (${event.date.toLocaleDateString('id-ID')})`,
          type: 'WARNING',
          userId: event.userId,
          calendarEventId: event.id,
        },
      });

      await prisma.calendarEvent.update({
        where: { id: event.id },
        data: { notified1Day: true },
      });

      logger.info(`Created 1-day notification for event: ${event.title}`);
    }

    logger.info('Cron job completed: upcoming events check');
  } catch (error) {
    logger.error('Error in cron job (checkUpcomingEvents):', error);
  }
};

// Check for overdue follow-ups
export const checkOverdueFollowUps = async (): Promise<void> => {
  try {
    logger.info('Running cron job: checking overdue follow-ups');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find incoming letters with overdue follow-ups
    const overdueLetters = await prisma.incomingLetter.findMany({
      where: {
        needsFollowUp: true,
        followUpDeadline: {
          lt: today,
        },
        overdueNotifiedAt: null,
      },
      include: {
        user: true,
      },
    });

    for (const letter of overdueLetters) {
      await prisma.notification.create({
        data: {
          title: `Tindak Lanjut Terlambat: ${letter.letterNumber}`,
          message: `Surat "${letter.subject}" memerlukan tindak lanjut yang sudah melewati batas waktu`,
          type: 'ERROR',
          userId: letter.userId,
        },
      });

      await prisma.incomingLetter.update({
        where: { id: letter.id },
        data: { overdueNotifiedAt: new Date() },
      });

      logger.info(`Created overdue notification for letter: ${letter.letterNumber}`);
    }

    logger.info('Cron job completed: overdue follow-ups check');
  } catch (error) {
    logger.error('Error in cron job (checkOverdueFollowUps):', error);
  }
};

// Initialize cron jobs
export const initCronJobs = (): void => {
  // Run event check every day at 8:00 AM
  cron.schedule('0 8 * * *', () => {
    checkUpcomingEvents();
    checkOverdueFollowUps();
  });

  logger.info('Cron jobs initialized');
};

export default { initCronJobs, checkUpcomingEvents, checkOverdueFollowUps };
