-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "LetterNature" AS ENUM ('BIASA', 'TERBATAS', 'RAHASIA', 'SANGAT_RAHASIA', 'PENTING');

-- CreateEnum
CREATE TYPE "SecurityClass" AS ENUM ('BIASA', 'TERBATAS');

-- CreateEnum
CREATE TYPE "ProcessingMethod" AS ENUM ('MANUAL', 'SRIKANDI');

-- CreateEnum
CREATE TYPE "DispositionTarget" AS ENUM ('UMPEG', 'PERENCANAAN', 'KAUR_KEUANGAN', 'KABID', 'BIDANG1', 'BIDANG2', 'BIDANG3', 'BIDANG4', 'BIDANG5');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MEETING', 'APPOINTMENT', 'DEADLINE', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incoming_letters" (
    "id" TEXT NOT NULL,
    "letterNumber" TEXT NOT NULL,
    "letterDate" TIMESTAMP(3),
    "letterNature" "LetterNature" NOT NULL DEFAULT 'BIASA',
    "subject" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "processor" TEXT NOT NULL,
    "note" TEXT,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "fileName" TEXT,
    "filePath" TEXT,
    "isInvitation" BOOLEAN NOT NULL DEFAULT false,
    "eventDate" TIMESTAMP(3),
    "eventTime" TEXT,
    "eventLocation" TEXT,
    "eventNotes" TEXT,
    "needsFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "followUpDeadline" TIMESTAMP(3),
    "processingMethod" "ProcessingMethod" NOT NULL DEFAULT 'MANUAL',
    "dispositionTarget" "DispositionTarget",
    "srikandiDispositionNumber" TEXT,
    "overdueNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "incoming_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outgoing_letters" (
    "id" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL,
    "letterDate" TIMESTAMP(3) NOT NULL,
    "letterNumber" TEXT NOT NULL,
    "letterNature" "LetterNature" NOT NULL DEFAULT 'BIASA',
    "subject" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "processor" TEXT NOT NULL,
    "note" TEXT,
    "fileName" TEXT,
    "filePath" TEXT,
    "isInvitation" BOOLEAN NOT NULL DEFAULT false,
    "eventDate" TIMESTAMP(3),
    "eventTime" TEXT,
    "eventLocation" TEXT,
    "eventNotes" TEXT,
    "executionDate" TIMESTAMP(3),
    "classificationCode" TEXT,
    "serialNumber" INTEGER,
    "securityClass" "SecurityClass" NOT NULL DEFAULT 'BIASA',
    "processingMethod" "ProcessingMethod" NOT NULL DEFAULT 'MANUAL',
    "srikandiDispositionNumber" TEXT,
    "overdueNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "outgoing_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "location" TEXT,
    "type" "EventType" NOT NULL DEFAULT 'OTHER',
    "notified7Days" BOOLEAN NOT NULL DEFAULT false,
    "notified3Days" BOOLEAN NOT NULL DEFAULT false,
    "notified1Day" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "incomingLetterId" TEXT,
    "outgoingLetterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "calendarEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "incoming_letters_letterNumber_key" ON "incoming_letters"("letterNumber");

-- CreateIndex
CREATE INDEX "incoming_letters_letterNumber_idx" ON "incoming_letters"("letterNumber");

-- CreateIndex
CREATE INDEX "incoming_letters_receivedDate_idx" ON "incoming_letters"("receivedDate");

-- CreateIndex
CREATE INDEX "incoming_letters_userId_idx" ON "incoming_letters"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "outgoing_letters_letterNumber_key" ON "outgoing_letters"("letterNumber");

-- CreateIndex
CREATE INDEX "outgoing_letters_letterNumber_idx" ON "outgoing_letters"("letterNumber");

-- CreateIndex
CREATE INDEX "outgoing_letters_letterDate_idx" ON "outgoing_letters"("letterDate");

-- CreateIndex
CREATE INDEX "outgoing_letters_userId_idx" ON "outgoing_letters"("userId");

-- CreateIndex
CREATE INDEX "calendar_events_date_idx" ON "calendar_events"("date");

-- CreateIndex
CREATE INDEX "calendar_events_userId_idx" ON "calendar_events"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- AddForeignKey
ALTER TABLE "incoming_letters" ADD CONSTRAINT "incoming_letters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outgoing_letters" ADD CONSTRAINT "outgoing_letters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_incomingLetterId_fkey" FOREIGN KEY ("incomingLetterId") REFERENCES "incoming_letters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_outgoingLetterId_fkey" FOREIGN KEY ("outgoingLetterId") REFERENCES "outgoing_letters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "calendar_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
