-- CreateTable
CREATE TABLE "CoachGoogleAuth" (
    "coachId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachGoogleAuth_pkey" PRIMARY KEY ("coachId")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoachGoogleAuth_coachId_key" ON "CoachGoogleAuth"("coachId");

-- CreateIndex
CREATE INDEX "CoachGoogleAuth_coachId_idx" ON "CoachGoogleAuth"("coachId");

-- AddForeignKey
ALTER TABLE "CoachGoogleAuth" ADD CONSTRAINT "CoachGoogleAuth_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "CoachProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
