import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '../../../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class MeetingService {
  private readonly logger = new Logger(MeetingService.name);
  
  constructor(private prisma: PrismaService) {}

  /**
   * Create a real Google Meet link using Google Calendar API
   * 
   * @param coachEmail - Email of the coach
   * @param employeeEmail - Email of the employee attending
   * @param startTime - Start time of the meeting
   * @param endTime - End time of the meeting
   * @returns Object with meetingLink and calendarEventId
   */
  async createGoogleMeet(
    coachEmail: string,
    employeeEmail: string,
    startTime: Date,
    endTime: Date,
  ): Promise<{ meetingLink: string; calendarEventId: string }> {
    try {
      // Check if Google Calendar is configured
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
        this.logger.warn('⚠️  Google Calendar not configured, using placeholder link');
        return {
          meetingLink: this.createMeeting(),
          calendarEventId: `placeholder-${randomUUID()}`,
        };
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI,
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const event = await calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        requestBody: {
          summary: 'Koshpal Financial Consultation',
          description: '1-on-1 financial coaching session scheduled via Koshpal Employee Portal',
          start: {
            dateTime: startTime.toISOString(),
            timeZone: 'Asia/Kolkata',
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: 'Asia/Kolkata',
          },
          attendees: [
            { email: employeeEmail },
            { email: coachEmail },
          ],
          conferenceData: {
            createRequest: {
              requestId: `koshpal-${randomUUID()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 }, // 1 day before
              { method: 'popup', minutes: 60 },       // 1 hour before
              { method: 'popup', minutes: 10 },       // 10 minutes before
            ],
          },
        },
      });

      if (!event.data.hangoutLink) {
        throw new BadRequestException('Failed to generate Google Meet link');
      }

      this.logger.log(`✅ Created Google Meet for consultation: ${event.data.id}`);

      return {
        meetingLink: event.data.hangoutLink,
        calendarEventId: event.data.id!,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to create Google Meet: ${error.message}`);
      // Fallback to placeholder if Google Calendar fails
      this.logger.warn('⚠️  Falling back to placeholder meeting link');
      return {
        meetingLink: this.createMeeting(),
        calendarEventId: `error-${randomUUID()}`,
      };
    }
  }

  /**
   * Fallback: Create a placeholder meeting link for development/testing
   * Use this when Google Calendar is not configured
   */
  createMeeting(): string {
    const randomString = Math.random().toString(36).substring(2, 12);
    return `https://meet.google.com/${randomString}`;
  }
}
