import { Injectable } from '@nestjs/common';

@Injectable()
export class MeetingService {
  createMeeting(): string {
    const randomString = Math.random().toString(36).substring(2, 12);
    return `https://meet.google.com/${randomString}`;
  }
}
