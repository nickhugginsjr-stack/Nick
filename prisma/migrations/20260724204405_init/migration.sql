-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('COLD', 'WARM', 'FOLLOW_UP', 'CLIENT', 'DO_NOT_CALL');

-- CreateEnum
CREATE TYPE "Disposition" AS ENUM ('APPOINTMENT', 'FOLLOW_UP', 'VOICEMAIL', 'NO_ANSWER', 'NOT_INTERESTED', 'WRONG_NUMBER', 'DO_NOT_CALL', 'SAVE_AND_NEXT');

-- CreateEnum
CREATE TYPE "CallState" AS ENUM ('QUEUED', 'DIALING_REP', 'RINGING_REP', 'DIALING_PROSPECT', 'RINGING_PROSPECT', 'CONNECTED', 'BUSY', 'FAILED', 'NO_ANSWER', 'VOICEMAIL', 'SAVING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('COLD_CALL', 'FOLLOW_UP_CALL', 'OFFICE_VISIT', 'APPOINTMENT', 'PROPOSAL', 'APPLICATION', 'POLICY_REVIEW', 'QUOTE', 'BECAME_CLIENT', 'NOTE');

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "industry" TEXT,
    "addressLine1" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "relationshipStatus" "RelationshipStatus" NOT NULL DEFAULT 'COLD',
    "script" TEXT,
    "quickFacts" TEXT,
    "lastContactedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DialSession" (
    "id" TEXT NOT NULL,
    "repPhone" TEXT NOT NULL,
    "goal" INTEGER NOT NULL DEFAULT 100,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "repCallSid" TEXT,

    CONSTRAINT "DialSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "twilioCallSid" TEXT,
    "state" "CallState" NOT NULL DEFAULT 'QUEUED',
    "disposition" "Disposition",
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "connectedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "callId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "type" "TimelineEventType" NOT NULL,
    "label" TEXT NOT NULL,
    "notes" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prospect_relationshipStatus_idx" ON "Prospect"("relationshipStatus");

-- CreateIndex
CREATE INDEX "Call_sessionId_idx" ON "Call"("sessionId");

-- CreateIndex
CREATE INDEX "Call_prospectId_idx" ON "Call"("prospectId");

-- CreateIndex
CREATE INDEX "Note_prospectId_idx" ON "Note"("prospectId");

-- CreateIndex
CREATE INDEX "ActivityEvent_sessionId_idx" ON "ActivityEvent"("sessionId");

-- CreateIndex
CREATE INDEX "TimelineEvent_prospectId_idx" ON "TimelineEvent"("prospectId");

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DialSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DialSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
