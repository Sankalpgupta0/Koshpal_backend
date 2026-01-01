export declare enum ConsultationStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    COMPLETED = "COMPLETED"
}
export declare class UpdateConsultationStatusDto {
    status: ConsultationStatus;
    notes?: string;
}
