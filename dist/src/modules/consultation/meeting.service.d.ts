import { PrismaService } from '../../../prisma/prisma.service';
export declare class MeetingService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createGoogleMeet(coachEmail: string, employeeEmail: string, startTime: Date, endTime: Date): Promise<{
        meetingLink: string;
        calendarEventId: string;
    }>;
    private createPlaceholderMeeting;
}
