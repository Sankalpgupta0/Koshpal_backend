"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MeetingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingService = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
const prisma_service_1 = require("../../../prisma/prisma.service");
const crypto_1 = require("crypto");
let MeetingService = MeetingService_1 = class MeetingService {
    prisma;
    logger = new common_1.Logger(MeetingService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createGoogleMeet(coachEmail, employeeEmail, startTime, endTime) {
        try {
            if (!process.env.GOOGLE_CLIENT_ID ||
                !process.env.GOOGLE_CLIENT_SECRET ||
                !process.env.GOOGLE_REFRESH_TOKEN) {
                this.logger.warn('⚠️ Google Calendar not configured. Using placeholder link.');
                return {
                    meetingLink: this.createPlaceholderMeeting(),
                    calendarEventId: `placeholder-${(0, crypto_1.randomUUID)()}`,
                };
            }
            const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
            oauth2Client.setCredentials({
                refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
            });
            const calendar = googleapis_1.google.calendar({
                version: 'v3',
                auth: oauth2Client,
            });
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
                    attendees: [{ email: employeeEmail }, { email: coachEmail }],
                    conferenceData: {
                        createRequest: {
                            requestId: `koshpal-${(0, crypto_1.randomUUID)()}`,
                            conferenceSolutionKey: {
                                type: 'hangoutsMeet',
                            },
                        },
                    },
                    reminders: {
                        useDefault: false,
                        overrides: [
                            { method: 'email', minutes: 24 * 60 },
                            { method: 'popup', minutes: 60 },
                            { method: 'popup', minutes: 10 },
                        ],
                    },
                },
            });
            if (!event.data.hangoutLink || !event.data.id) {
                throw new common_1.BadRequestException('Google Meet link not generated');
            }
            this.logger.log(`✅ Google Meet created | Event ID: ${event.data.id}`);
            return {
                meetingLink: event.data.hangoutLink,
                calendarEventId: event.data.id,
            };
        }
        catch (error) {
            this.logger.error('='.repeat(60));
            this.logger.error('❌ Failed to create Google Meet');
            this.logger.error(JSON.stringify(error?.response?.data || error?.message || error, null, 2));
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
                calendarEventId: `error-${(0, crypto_1.randomUUID)()}`,
            };
        }
    }
    createPlaceholderMeeting() {
        const part1 = Math.random().toString(36).substring(2, 5);
        const part2 = Math.random().toString(36).substring(2, 6);
        const part3 = Math.random().toString(36).substring(2, 5);
        return `https://meet.google.com/${part1}-${part2}-${part3}`;
    }
};
exports.MeetingService = MeetingService;
exports.MeetingService = MeetingService = MeetingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MeetingService);
//# sourceMappingURL=meeting.service.js.map