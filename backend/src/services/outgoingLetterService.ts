import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { NotFoundError, ConflictError } from '../middlewares/error.middleware';
import { parseDate } from '../utils/helpers';
import { createEventNotifications, deleteEventNotifications, updateEventNotifications } from './notificationService';
import { CreateOutgoingLetterInput, UpdateOutgoingLetterInput } from '../validators/outgoingLetter.validator';

// User select for including in responses
const userSelect = {
  id: true,
  name: true,
  email: true,
};

export interface GetOutgoingLettersParams {
  skip: number;
  take: number;
  where: Prisma.OutgoingLetterWhereInput;
  orderBy: Prisma.OutgoingLetterOrderByWithRelationInput;
}

/**
 * Service layer for outgoing letter operations
 * Handles business logic separate from HTTP concerns
 */
export class OutgoingLetterService {
  /**
   * Get all outgoing letters with pagination and filters
   */
  async getOutgoingLetters(params: GetOutgoingLettersParams) {
    const { skip, take, where, orderBy } = params;

    // Use Promise.all for parallel execution - optimization
    const [letters, total] = await Promise.all([
      prisma.outgoingLetter.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: {
            select: userSelect,
          },
        },
      }),
      prisma.outgoingLetter.count({ where }),
    ]);

    return { letters, total };
  }

  /**
   * Get single outgoing letter by ID
   */
  async getOutgoingLetterById(id: string) {
    const letter = await prisma.outgoingLetter.findUnique({
      where: { id },
      include: {
        user: {
          select: userSelect,
        },
      },
    });

    if (!letter) {
      throw new NotFoundError('Outgoing letter');
    }

    return letter;
  }

  /**
   * Create new outgoing letter with transaction for data consistency
   */
  async createOutgoingLetter(
    data: CreateOutgoingLetterInput,
    userId: string,
    file?: Express.Multer.File
  ) {
    // Check for duplicate letter number
    const existing = await prisma.outgoingLetter.findUnique({
      where: { letterNumber: data.letterNumber },
    });

    if (existing) {
      throw new ConflictError('Letter number already exists', 'letterNumber');
    }

    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Create letter
      const letterData: Prisma.OutgoingLetterCreateInput = {
        createdDate: parseDate(data.createdDate),
        letterDate: parseDate(data.letterDate),
        letterNumber: data.letterNumber,
        letterNature: data.letterNature,
        subject: data.subject,
        sender: data.sender,
        recipient: data.recipient,
        processor: data.processor,
        note: data.note,
        isInvitation: data.isInvitation,
        eventDate: data.eventDate ? parseDate(data.eventDate) : null,
        eventTime: data.eventTime,
        eventLocation: data.eventLocation,
        eventNotes: data.eventNotes,
        executionDate: data.executionDate ? parseDate(data.executionDate) : null,
        classificationCode: data.classificationCode,
        serialNumber: data.serialNumber,
        securityClass: data.securityClass,
        processingMethod: data.processingMethod,
        srikandiDispositionNumber: data.srikandiDispositionNumber,
        fileName: file?.originalname,
        filePath: file?.path ? file.path.replace(/\\/g, '/').replace(/^uploads\//, '') : undefined,
        user: {
          connect: { id: userId },
        },
      };

      const letter = await tx.outgoingLetter.create({
        data: letterData,
        include: {
          user: {
            select: userSelect,
          },
        },
      });

      // Create calendar event if invitation
      if (data.isInvitation && data.eventDate) {
        const calendarEvent = await tx.calendarEvent.create({
          data: {
            title: `[Undangan] ${data.subject}`,
            description: data.eventNotes,
            date: parseDate(data.eventDate),
            time: data.eventTime,
            location: data.eventLocation,
            type: 'MEETING',
            userId: userId,
            outgoingLetterId: letter.id,
          },
        });

        // Create notifications for H-7, H-3, H-1
        await createEventNotifications(
          calendarEvent.id,
          userId,
          calendarEvent.title,
          calendarEvent.date
        );
      }

      // Create notification for new letter
      await tx.notification.create({
        data: {
          title: 'Surat Keluar Baru',
          message: `Surat keluar baru: ${data.letterNumber} - ${data.subject}`,
          type: 'INFO',
        },
      });

      return letter;
    });
  }

  /**
   * Update outgoing letter with transaction
   */
  async updateOutgoingLetter(
    id: string,
    data: UpdateOutgoingLetterInput,
    file?: Express.Multer.File
  ) {
    // Check if letter exists
    const existingLetter = await prisma.outgoingLetter.findUnique({
      where: { id },
    });

    if (!existingLetter) {
      throw new NotFoundError('Outgoing letter');
    }

    // Check for duplicate letter number (if changing)
    if (data.letterNumber && data.letterNumber !== existingLetter.letterNumber) {
      const duplicate = await prisma.outgoingLetter.findUnique({
        where: { letterNumber: data.letterNumber },
      });

      if (duplicate) {
        throw new ConflictError('Letter number already exists', 'letterNumber');
      }
    }

    // Use transaction for atomicity
    return await prisma.$transaction(async (tx) => {
      // Build update data
      const updateData: Prisma.OutgoingLetterUpdateInput = {
        ...(data.createdDate && { createdDate: parseDate(data.createdDate) }),
        ...(data.letterDate && { letterDate: parseDate(data.letterDate) }),
        ...(data.letterNumber && { letterNumber: data.letterNumber }),
        ...(data.letterNature && { letterNature: data.letterNature }),
        ...(data.subject && { subject: data.subject }),
        ...(data.sender && { sender: data.sender }),
        ...(data.recipient && { recipient: data.recipient }),
        ...(data.processor && { processor: data.processor }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.isInvitation !== undefined && { isInvitation: data.isInvitation }),
        ...(data.eventDate !== undefined && { eventDate: data.eventDate ? parseDate(data.eventDate) : null }),
        ...(data.eventTime !== undefined && { eventTime: data.eventTime }),
        ...(data.eventLocation !== undefined && { eventLocation: data.eventLocation }),
        ...(data.eventNotes !== undefined && { eventNotes: data.eventNotes }),
        ...(data.executionDate !== undefined && { executionDate: data.executionDate ? parseDate(data.executionDate) : null }),
        ...(data.classificationCode !== undefined && { classificationCode: data.classificationCode }),
        ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber }),
        ...(data.securityClass && { securityClass: data.securityClass }),
        ...(data.processingMethod && { processingMethod: data.processingMethod }),
        ...(data.srikandiDispositionNumber !== undefined && { srikandiDispositionNumber: data.srikandiDispositionNumber }),
        ...(file && { fileName: file.originalname, filePath: file.path.replace(/\\/g, '/').replace(/^uploads\//, '') }),
      };

      const letter = await tx.outgoingLetter.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: userSelect,
          },
        },
      });

      // Handle calendar event updates
      await this.handleCalendarEventUpdate(tx, id, letter, existingLetter, data);

      return letter;
    });
  }

  /**
   * Delete outgoing letter with cascade cleanup
   */
  async deleteOutgoingLetter(id: string) {
    // Check if letter exists
    const letter = await prisma.outgoingLetter.findUnique({
      where: { id },
    });

    if (!letter) {
      throw new NotFoundError('Outgoing letter');
    }

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Find and delete associated calendar events and their notifications
      const calendarEvents = await tx.calendarEvent.findMany({
        where: { outgoingLetterId: id },
      });

      for (const event of calendarEvents) {
        // Delete notifications for each calendar event
        await deleteEventNotifications(event.id);
      }

      // Delete associated calendar events
      await tx.calendarEvent.deleteMany({
        where: { outgoingLetterId: id },
      });

      // Delete the letter
      await tx.outgoingLetter.delete({
        where: { id },
      });
    });
  }

  /**
   * Handle calendar event updates when letter is modified
   * Private helper method
   */
  private async handleCalendarEventUpdate(
    tx: Prisma.TransactionClient,
    letterId: string,
    updatedLetter: any,
    existingLetter: any,
    data: UpdateOutgoingLetterInput
  ) {
    // Determine final values after update
    const finalIsInvitation = data.isInvitation !== undefined ? data.isInvitation : existingLetter.isInvitation;
    const finalEventDate = data.eventDate !== undefined ? (data.eventDate ? parseDate(data.eventDate) : null) : existingLetter.eventDate;
    const wasInvitation = existingLetter.isInvitation;
    const oldEventDate = existingLetter.eventDate;

    // Check if calendar event already exists
    const existingCalendarEvent = await tx.calendarEvent.findFirst({
      where: { outgoingLetterId: letterId },
    });

    // SCENARIO 1: Changed from non-event to event
    if (!wasInvitation && finalIsInvitation && finalEventDate) {
      const eventData = {
        title: `[Undangan] ${updatedLetter.subject}`,
        description: updatedLetter.eventNotes,
        date: finalEventDate,
        time: updatedLetter.eventTime,
        location: updatedLetter.eventLocation,
        type: 'MEETING' as const,
        userId: existingLetter.userId,
      };

      // Create new calendar event
      const calendarEvent = await tx.calendarEvent.create({
        data: {
          ...eventData,
          outgoingLetterId: updatedLetter.id,
        },
      });

      // Create notifications for H-7, H-3, H-1
      await createEventNotifications(
        calendarEvent.id,
        existingLetter.userId,
        calendarEvent.title,
        calendarEvent.date
      );
    }
    // SCENARIO 2: Changed from event to non-event
    else if (wasInvitation && !finalIsInvitation) {
      if (existingCalendarEvent) {
        // Delete all notifications associated with this event
        await deleteEventNotifications(existingCalendarEvent.id);

        // Delete calendar event
        await tx.calendarEvent.delete({
          where: { id: existingCalendarEvent.id },
        });
      }
    }
    // SCENARIO 3: Still an event - update event and notifications if needed
    else if (finalIsInvitation && finalEventDate) {
      const eventData = {
        title: `[Undangan] ${updatedLetter.subject}`,
        description: updatedLetter.eventNotes,
        date: finalEventDate,
        time: updatedLetter.eventTime,
        location: updatedLetter.eventLocation,
        type: 'MEETING' as const,
        userId: existingLetter.userId,
      };

      if (existingCalendarEvent) {
        // Update existing calendar event
        await tx.calendarEvent.update({
          where: { id: existingCalendarEvent.id },
          data: eventData,
        });

        // Check if event date changed
        const dateChanged = oldEventDate && finalEventDate &&
          oldEventDate.getTime() !== finalEventDate.getTime();

        if (dateChanged) {
          // Date changed - update notifications (delete old, create new)
          await updateEventNotifications(
            existingCalendarEvent.id,
            existingLetter.userId,
            eventData.title,
            eventData.date
          );
        }
      } else {
        // Calendar event doesn't exist but should - create it
        const calendarEvent = await tx.calendarEvent.create({
          data: {
            ...eventData,
            outgoingLetterId: updatedLetter.id,
          },
        });

        // Create notifications
        await createEventNotifications(
          calendarEvent.id,
          existingLetter.userId,
          calendarEvent.title,
          calendarEvent.date
        );
      }
    }
    // SCENARIO 4: Was event, still event, but no event date provided
    else if (finalIsInvitation && !finalEventDate && existingCalendarEvent) {
      // Delete notifications and calendar event since no valid date
      await deleteEventNotifications(existingCalendarEvent.id);
      await tx.calendarEvent.delete({
        where: { id: existingCalendarEvent.id },
      });
    }
  }
}

// Export singleton instance
export const outgoingLetterService = new OutgoingLetterService();
