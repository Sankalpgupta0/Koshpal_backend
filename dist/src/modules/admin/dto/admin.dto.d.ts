export declare class CreateCompanyDto {
    name: string;
    employeeLimit?: number;
}
export declare class UpdateCompanyStatusDto {
    status: 'ACTIVE' | 'INACTIVE';
}
export declare class UpdateCompanyLimitsDto {
    employeeLimit: number;
}
export declare class CreateHrDto {
    email: string;
    password: string;
    companyId: string;
    fullName: string;
    phone?: string;
    designation?: string;
}
export declare class UpdateHrStatusDto {
    status: 'ACTIVE' | 'INACTIVE';
}
