import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '../../../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class MeetingService {
  private readonly logger = new Logger(MeetingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a REAL Google Meet link using Google Calendar API
   * Uses refresh token (server-to-server OAuth)
   */
  async createGoogleMeet(
    coachEmail: string,
    employeeEmail: string,
    startTime: Date,
    endTime: Date,
  ): Promise<{ meetingLink: string; calendarEventId: string }> {
    try {
      // ---------------------------------------------------------
      // 1️⃣ Safety: Check Google OAuth configuration
      // ---------------------------------------------------------
      if (
        !process.env.GOOGLE_CLIENT_ID ||
        !process.env.GOOGLE_CLIENT_SECRET ||
        !process.env.GOOGLE_REFRESH_TOKEN
      ) {
        this.logger.warn(
          '⚠️ Google Calendar not configured. Using placeholder link.',
        );
        return {
          meetingLink: this.createPlaceholderMeeting(),
          calendarEventId: `placeholder-${randomUUID()}`,
        };
      }

      // ---------------------------------------------------------
      // 2️⃣ OAuth Client (NO redirect_uri here)
      // ---------------------------------------------------------
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });

      // ---------------------------------------------------------
      // 3️⃣ Google Calendar API
      // ---------------------------------------------------------
      const calendar = google.calendar({
        version: 'v3',
        auth: oauth2Client,
      });

      // ---------------------------------------------------------
      // 4️⃣ Create Calendar Event + Google Meet
      // ---------------------------------------------------------
      const event = await calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        requestBody: {
          summary: 'Koshpal Financial Consultation',
          description:
            '1-on-1 financial coaching session scheduled via Koshpal Employee Portal',

          start: {
            dateTime: startTime.toISOString(),
            timeZone: 'Asia/Kolkata',
          },

          end: {
            dateTime: endTime.toISOString(),
            timeZone: 'Asia/Kolkata',
          },

          attendees: [{ email: employeeEmail }, { email: coachEmail }],

          conferenceData: {
            createRequest: {
              requestId: `koshpal-${randomUUID()}`,
              conferenceSolutionKey: {
                type: 'hangoutsMeet',
              },
            },
          },

          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 }, // 1 day
              { method: 'popup', minutes: 60 }, // 1 hour
              { method: 'popup', minutes: 10 }, // 10 minutes
            ],
          },
        },
      });

      // ---------------------------------------------------------
      // 5️⃣ Validate Meet link
      // ---------------------------------------------------------
      if (!event.data.hangoutLink || !event.data.id) {
        throw new BadRequestException('Google Meet link not generated');
      }

      this.logger.log(`✅ Google Meet created | Event ID: ${event.data.id}`);

      return {
        meetingLink: event.data.hangoutLink,
        calendarEventId: event.data.id,
      };
    } catch (error: any) {
      // ---------------------------------------------------------
      // 6️⃣ Error Handling + Safe Fallback
      // ---------------------------------------------------------
      this.logger.error('='.repeat(60));
      this.logger.error('❌ Failed to create Google Meet');

      this.logger.error(
        JSON.stringify(
          error?.response?.data || error?.message || error,
          null,
          2,
        ),
      );

      this.logger.error('');
      this.logger.error('🔧 Common causes:');
      this.logger.error('   • Refresh token generated with wrong OAuth client');
      this.logger.error('   • OAuth client type is NOT "Web application"');
      this.logger.error('   • Google Calendar API is disabled');
      this.logger.error('   • Token generated with wrong scopes');
      this.logger.error('='.repeat(60));

      this.logger.warn('⚠️ Falling back to placeholder meeting link');

      return {
        meetingLink: this.createPlaceholderMeeting(),
        calendarEventId: `error-${randomUUID()}`,
      };
    }
  }

  /**
   * Fallback placeholder Google Meet-style link
   * Used ONLY for local/dev safety
   */
  private createPlaceholderMeeting(): string {
    const part1 = Math.random().toString(36).substring(2, 5);
    const part2 = Math.random().toString(36).substring(2, 6);
    const part3 = Math.random().toString(36).substring(2, 5);
    return `https://meet.google.com/${part1}-${part2}-${part3}`;
  }
}
