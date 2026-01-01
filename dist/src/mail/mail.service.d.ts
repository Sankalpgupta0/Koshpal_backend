export declare function sendCredentialsEmail(email: string, fullName: string, password: string): Promise<void>;
export declare function sendEmail(options: {
    to: string;
    subject: string;
    html: string;
}): Promise<void>;
export declare function verifyEmailConnection(): Promise<boolean>;
export declare function sendConsultationBookingEmails(data: {
    employeeEmail: string;
    coachEmail: string;
    date: string;
    startTime: string | Date;
    endTime: string | Date;
    meetingLink: string;
}): Promise<void>;
export declare function sendPasswordResetEmail(email: string, fullName: string, resetToken: string): Promise<void>;
export declare function sendConsultationCancellationEmails(data: {
    employeeEmail: string;
    coachEmail: string;
    date: string;
    startTime: string | Date;
    cancelledBy: 'EMPLOYEE' | 'COACH';
    reason?: string;
}): Promise<void>;
