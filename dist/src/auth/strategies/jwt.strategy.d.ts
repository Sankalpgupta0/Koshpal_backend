import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ValidatedUser } from '../../common/types/user.types';
interface JwtPayload {
    sub: string;
    role: string;
    companyId: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(configService: ConfigService);
    validate(payload: JwtPayload): ValidatedUser;
}
export {};
